import { Plugin } from 'obsidian';
import { Settings, SettingsTab, DEFAULT_SETTINGS, DefaultSettings } from './Settings';
import { Translations } from './Translations';
import { Hotkeys } from './Hotkeys';
import { ViewMode } from './ViewMode';
import { DashboardView, DashboardManager, VIEW_TYPE_DASHBOARD } from './Dashboard';

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

         // Ajout du bouton dans la barre latérale
         this.addRibbonIcon('layout-dashboard', 'Open LinkFlowz Dashboard', () => {
            this.dashboardManager.openDashboard(this.settings.viewMode);
         });
      });

      // Ajout de la page de paramètres
      this.addSettingTab(new SettingsTab(
         this.app,
         this,
         settings,
         this.translations
      ));
   }

   private loadLanguage(): void {
      const locale = document.documentElement.lang?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
      this.translations.setLanguage(locale);
   }

   onunload() {
      // Fermer la vue si elle est ouverte
      const leaf = this.dashboardManager?.getCurrentLeaf();
      if (leaf) {
         leaf.detach();
      }
   }
}