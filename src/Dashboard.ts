import { Plugin, WorkspaceLeaf, ItemView } from 'obsidian';
import { Translations } from './Translations';

export const VIEW_TYPE_DASHBOARD = "linkflowz-dashboard";

export class DashboardView extends ItemView {
   constructor(
      leaf: WorkspaceLeaf,
      private plugin: Plugin,
      private translations: Translations
   ) {
      super(leaf);
   }

   getViewType(): string {
      return VIEW_TYPE_DASHBOARD;
   }

   getDisplayText(): string {
      return this.translations.t('dashboard.title');
   }

   async onOpen() {
      const container = this.containerEl.children[1];
      container.empty();
      container.createEl("h2", { text: this.translations.t('dashboard.title') });
      
      // Conteneur pour la liste des liens
      const linksContainer = container.createEl("div", { cls: "linkflowz-links" });
      
      // TODO: Charger et afficher les liens depuis dub.co
   }

   async onClose() {
      // Nettoyage si nécessaire
   }
}

export class DashboardManager {
   constructor(private plugin: Plugin, private translations: Translations) {}

   async openDashboard(mode: 'tab' | 'sidebar' | 'overlay') {
      // Chercher une vue dashboard existante
      const existingLeaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD);
      if (existingLeaves.length > 0) {
         // Si une vue existe déjà, la révéler
         this.plugin.app.workspace.revealLeaf(existingLeaves[0]);
         return;
      }

      // Si aucune vue n'existe, en créer une nouvelle via ViewMode
      const viewMode = this.plugin.viewMode;
      await viewMode.setView(mode);
   }

   getCurrentLeaf(): WorkspaceLeaf | null {
      const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD);
      return leaves.length > 0 ? leaves[0] : null;
   }
} 