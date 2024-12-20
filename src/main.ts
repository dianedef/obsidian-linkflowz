import { Plugin, Menu, Notice, WorkspaceLeaf, TFile } from 'obsidian';
import { Settings, SettingsTab, DEFAULT_SETTINGS, DefaultSettings } from './Settings';
import { Translations } from './Translations';
import { TViewMode } from './types';
import { Hotkeys } from './Hotkeys';
import { ViewMode } from './ViewMode';
import { DashboardView, DashboardManager, VIEW_TYPE_DASHBOARD } from './Dashboard';
import { registerStyles, unregisterStyles } from './RegisterStyles';

export default class LinkFlowz extends Plugin {
   settings!: DefaultSettings;
   private translations: Translations = new Translations();
   private hotkeys!: Hotkeys;
   private viewMode!: ViewMode;
   private dashboardManager!: DashboardManager;

   async onload() {
      // Initialisation des paramètres et traductions
      Settings.initialize(this);
      const settings = await Settings.loadSettings();
      this.settings = settings;
      this.loadLanguage();

      // Enregistrer les styles CSS
      registerStyles();

      // Initialisation des hotkeys
      this.hotkeys = new Hotkeys(this, this.settings, this.translations);
      this.hotkeys.registerHotkeys();
      
      // Attendre que le workspace soit prêt
      this.app.workspace.onLayoutReady(() => {
         // Initialisation de ViewMode
         this.viewMode = new ViewMode(this);

         // Enregistrement de la vue dashboard
         this.registerView(
            VIEW_TYPE_DASHBOARD,
            (leaf) => new DashboardView(leaf, this, this.translations)
         );

         // Initialisation du dashboard manager
         this.dashboardManager = new DashboardManager(this, this.translations);

         // Ajout du bouton dans la barre latérale avec menu hover
         const ribbonIconEl = this.addRibbonIcon(
            'layout-dashboard',
            this.translations.t('dashboard.title'),
            async () => {
               try {
                  const mode = await Settings.getViewMode();
                  await this.viewMode.setView(mode);
               } catch (error) {
                  console.error('[LinkFlowz]', error);
                  new Notice(this.translations.t('notices.error'));
               }
            }
         );

         // Menu hover
         this.registerDomEvent(ribbonIconEl, 'mouseenter', () => {
            const menu = new Menu();

            const createMenuItem = (title: string, icon: string, mode: TViewMode) => {
               menu.addItem((item) => {
                  item.setTitle(title)
                     .setIcon(icon)
                     .onClick(async () => {
                        try {
                           await this.viewMode.setView(mode);
                           await Settings.saveSettings({ currentMode: mode });
                           new Notice(this.translations.t('notices.success'));
                        } catch (error) {
                           console.error('[LinkFlowz]', error);
                           new Notice(this.translations.t('notices.error'));
                        }
                     });
               });
            };

            createMenuItem(this.translations.t('dashboard.viewModeTab'), "tab", "tab");
            createMenuItem(this.translations.t('dashboard.viewModeSidebar'), "layout-sidebar-right", "sidebar");
            createMenuItem(this.translations.t('dashboard.viewModePopup'), "layout-top", "overlay");

            // Positionner le menu au-dessus de l'icône
            const rect = ribbonIconEl.getBoundingClientRect();
            menu.showAtPosition({ 
               x: rect.left, 
               y: rect.top
            });

            // Gérer la fermeture du menu
            const closeMenu = (e: MouseEvent) => {
               const target = e.relatedTarget as HTMLElement;
               if (!target?.closest('.menu') && !target?.closest('.clickable-icon')) {
                  menu.hide();
                  document.removeEventListener('mouseover', closeMenu);
               }
            };

            document.addEventListener('mouseover', closeMenu);
         });
      });

      // Ajout de la page de paramètres
      this.addSettingTab(new SettingsTab(
         this.app,
         this,
         settings,
         this.translations
      ));

      // Écouter les modifications manuelles des notes
      this.registerEvent(
         this.app.vault.on('modify', async (file: TFile) => {
            try {
               const settings = await Settings.loadSettings();
               if (file.path.startsWith(settings.notesFolder)) {
                  // Rafraîchir la vue
                  if (this.dashboard) {
                     await this.dashboard.refresh();
                  }
               }
            } catch (error) {
               console.error('[LinkFlowz] Erreur lors du rafraîchissement:', error);
            }
         })
      );

      registerStyles();
   }

   private loadLanguage(): void {
      const locale = document.documentElement.lang?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
      this.translations.setLanguage(locale);
   }

   onunload() {
      // Supprimer les styles
      unregisterStyles();
      
      // Fermer la vue si elle est ouverte
      const leaf = this.dashboardManager?.getCurrentLeaf();
      if (leaf) {
         leaf.detach();
      }
   }
}