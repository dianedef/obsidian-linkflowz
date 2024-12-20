import { Plugin, Notice } from 'obsidian';
import { DefaultSettings } from './Settings';
import { Translations } from './Translations';
import { CreateShortLinkModal } from './ShortLinkModal';

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
   }
}
