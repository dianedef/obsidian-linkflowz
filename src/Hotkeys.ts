import { Plugin, Notice } from 'obsidian';
import { DefaultSettings } from './Settings';
import { Translations } from './Translations';
import { CreateShortLinkModal } from './ShortLinkModal';
import { VIEW_TYPE_DASHBOARD } from './Dashboard';

export class Hotkeys {
   constructor(
      private plugin: Plugin,
      private settings: DefaultSettings,
      private translations: Translations
   ) {}

   registerHotkeys() {
      // Commande pour créer un nouveau lien court
      this.plugin.addCommand({
         id: 'create-short-link',
         name: this.translations.t('modal.createShortLink'),
         callback: () => {
            if (!this.settings.dubApiKey) {
               new Notice(this.translations.t('notices.error').replace('{message}', 'API key not configured'));
               return;
            }

            new CreateShortLinkModal(
               this.plugin.app,
               this.plugin,
               this.settings,
               this.translations
            ).open();
         },
         hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "l" }]
      });

      // Commande pour focus la barre de recherche
      this.plugin.addCommand({
         id: 'focus-search',
         name: this.translations.t('dashboard.focusSearch'),
         checkCallback: (checking: boolean) => {
            const leaf = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD)[0];
            if (leaf) {
               if (!checking) {
                  // Révéler d'abord la vue
                  this.plugin.app.workspace.revealLeaf(leaf);
                  
                  // Puis focus sur la barre de recherche
                  setTimeout(() => {
                     const searchInput = leaf.view.containerEl.querySelector('.linkflowz-search-input') as HTMLInputElement;
                     if (searchInput) {
                        searchInput.focus();
                     }
                  }, 100); // Petit délai pour s'assurer que la vue est bien révélée
               }
               return true;
            }
            return false;
         },
         hotkeys: [{ modifiers: ["Ctrl"], key: "k" }]
      });
   }
}
