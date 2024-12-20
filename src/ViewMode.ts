import { Plugin, WorkspaceLeaf, Modal, Notice, Component } from 'obsidian';
import { TViewMode } from './types';
import { Settings } from './Settings';
import { DashboardView, VIEW_TYPE_DASHBOARD } from './Dashboard';
import { Translations } from './Translations';

export class ViewMode extends Component {
   private currentView: DashboardView | null = null;
   private currentMode: TViewMode | null = null;
   private activeLeaf: WorkspaceLeaf | null = null;
   private leafId: string | null = null;
   private translations: Translations;

   constructor(private plugin: Plugin) {
      super();
      this.translations = new Translations();
      // Initialiser les modes depuis les settings
      Settings.loadSettings().then(settings => {
         this.currentMode = settings.currentMode;
      });
      // Nettoyer les anciennes leafs au démarrage
      this.closeCurrentView();
   }

   private async closeCurrentView() {
      // Fermer la vue actuelle si elle existe
      if (this.currentView) {
         // Si c'est une leaf, la détacher
         if (this.activeLeaf) {
            this.activeLeaf.detach();
         }
         
         // Fermer toutes les autres vues existantes
         const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD);
         leaves.forEach(leaf => {
            if (leaf.view instanceof DashboardView) {
               leaf.detach();
            }
         });

         this.currentView = null;
         this.activeLeaf = null;
         this.leafId = null;
      }
   }

   async setView(mode: TViewMode) {
      // Si on est déjà dans le bon mode et que ce n'est pas un popup, ne rien faire
      if (mode === this.currentMode && this.currentView && mode !== 'overlay') {
         return;
      }

      // Fermer la vue actuelle et toutes les autres vues existantes
      await this.closeCurrentView();

      const workspace = this.plugin.app.workspace;

      // Gérer le mode overlay séparément car il n'utilise pas de leaf
      if (mode === 'overlay') {
         const modal = new Modal(this.plugin.app);
         modal.titleEl.setText(this.translations.t('dashboard.title'));
         modal.containerEl.addClass('linkflowz-modal');

         // Créer le conteneur pour le dashboard dans la modale
         const contentEl = modal.contentEl.createDiv('linkflowz-content');

         // Créer une instance de la DashboardView en mode overlay
         const view = new DashboardView(
            this.plugin.app.workspace.getLeaf('split'),
            this.plugin,
            this.translations
         );

         // Rendre le contenu
         await view.onOpen();
         
         this.currentView = view;
         this.activeLeaf = null;
         modal.open();
      } else {
         // Créer la leaf selon le mode
         let leaf: WorkspaceLeaf | null = null;
         switch (mode) {
            case 'sidebar':
               leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf('split');
               break;
            case 'tab':
            default:
               leaf = workspace.getLeaf('split');
               break;
         }

         if (leaf) {
            await leaf.setViewState({
               type: VIEW_TYPE_DASHBOARD,
               active: true,
               state: { 
                  mode: mode,
                  leafId: this.leafId
               }
            });

            this.currentView = leaf.view as DashboardView;
            this.activeLeaf = leaf;
            this.plugin.app.workspace.revealLeaf(leaf);
         }
      }

      this.currentMode = mode;
      await Settings.saveSettings({ currentMode: mode });
   }

   getActiveLeaf(): WorkspaceLeaf | null {
      return this.activeLeaf;
   }

   getCurrentLeafId(): string | null {
      return this.leafId;
   }

   getCurrentMode(): TViewMode | null {
      return this.currentMode;
   }
} 