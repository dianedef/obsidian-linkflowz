import { Plugin, Notice, Modal, Setting, App, MarkdownView, requestUrl, TFile } from 'obsidian';
import { Settings, DefaultSettings, DomainFolderMapping } from './Settings';
import { Translations } from './Translations';
import { CreateShortLinkModal } from './ShortLinkModal';

export class Hotkeys {
   constructor(
      private plugin: Plugin,
      private settings: DefaultSettings,
      private translations: Translations
   ) {}

   async createShortLink(url: string, slug: string, domain: string) {
      try {
         const response = await requestUrl({
            url: 'https://api.dub.co/v1/links',
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${this.settings.dubApiKey}`,
               'Accept': 'application/json'
            },
            body: JSON.stringify({
               url: url,
               ...(slug && { key: slug }),
               ...(domain && { domain: domain }),
               ...(this.settings.dubWorkspaceId && { workspaceId: this.settings.dubWorkspaceId })
            })
         });

         if (response.status === 200) {
            const shortUrl = `https://${domain || 'dub.co'}/${slug || response.json.key}`;
            const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
            
            if (activeView) {
               const editor = activeView.editor;
               const file = activeView.file;

               if (editor && file) {
                  // Créer le nouveau lien Markdown
                  const markdownLink = `[${url}](${shortUrl})`;
                  
                  // Obtenir la position du curseur
                  const cursor = editor.getCursor();
                  
                  // Insérer le lien à la position du curseur
                  editor.replaceRange(markdownLink, cursor);
                  
                  // Mettre à jour les liens dans le cache d'Obsidian
                  this.plugin.app.metadataCache.getFileCache(file);
                  
                  // Déclencher un événement de modification pour que Obsidian mette à jour ses liens
                  this.plugin.app.vault.modify(file, editor.getValue());
               }
            }
            
            new Notice(this.translations.t('notices.linkCreated'));
         } else {
            new Notice(this.translations.t('notices.error').replace('{message}', response.json?.error || 'Unknown error'));
         }
      } catch (error) {
         console.error('Erreur lors de la création du lien court:', error);
         new Notice(this.translations.t('notices.error').replace('{message}', error.message));
      }
   }

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
               this.translations,
               (url, slug, domain) => this.createShortLink(url, slug, domain)
            ).open();
         },
         hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "l" }]
      });
   }
}
