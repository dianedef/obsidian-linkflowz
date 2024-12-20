import { Plugin, Notice, Modal, Setting, App, MarkdownView, requestUrl, TFile } from 'obsidian';
import { Settings, DefaultSettings, DomainFolderMapping } from './Settings';
import { Translations } from './Translations';

class CreateShortLinkModal extends Modal {
   private url: string = '';
   private slug: string = '';
   private selectedDomain: string = '';

   constructor(
      app: App,
      private plugin: Plugin,
      private settings: DefaultSettings,
      private translations: Translations,
      private onSubmit: (url: string, slug: string, domain: string) => void
   ) {
      super(app);
   }

   private getDomainForCurrentFile(): string {
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) return 'dub.co';

      // Trouver le mapping correspondant au dossier du fichier actif
      const filePath = activeFile.path;
      const mapping = this.settings.domainFolderMappings.find(m => 
         filePath.startsWith(m.folder)
      );

      return mapping?.domain || 'dub.co';
   }

   onOpen() {
      const { contentEl } = this;
      contentEl.empty();

      contentEl.createEl("h2", { text: this.translations.t('modal.createShortLink') });

      // URL de destination
      new Setting(contentEl)
         .setName(this.translations.t('modal.destinationUrl'))
         .setDesc(this.translations.t('modal.destinationUrlDesc'))
         .addText(text => text
            .setPlaceholder('https://exemple.com/page-longue')
            .onChange(value => this.url = value));

      // Slug personnalisé
      new Setting(contentEl)
         .setName(this.translations.t('modal.customSlug'))
         .setDesc(this.translations.t('modal.customSlugDesc'))
         .addText(text => text
            .setPlaceholder('mon-lien')
            .onChange(value => this.slug = value));

      // Domaine personnalisé
      const defaultDomain = this.getDomainForCurrentFile();
      new Setting(contentEl)
         .setName(this.translations.t('modal.domain'))
         .setDesc(this.translations.t('modal.domainDesc'))
         .addDropdown(dropdown => {
            // Ajouter dub.co comme option par défaut
            dropdown.addOption('dub.co', 'dub.co');
            // Ajouter les domaines des mappages
            const uniqueDomains = [...new Set(this.settings.domainFolderMappings.map(m => m.domain))];
            uniqueDomains.forEach(domain => {
               if (domain !== 'dub.co') {
                  dropdown.addOption(domain, domain);
               }
            });
            dropdown.setValue(defaultDomain);
            dropdown.onChange(value => this.selectedDomain = value);
         });

      // Boutons
      const buttonContainer = contentEl.createEl('div', { cls: 'modal-button-container' });
      
      // Bouton Annuler
      buttonContainer.createEl('button', { text: 'Annuler' })
         .addEventListener('click', () => this.close());
      
      // Bouton Créer
      const createButton = buttonContainer.createEl('button', {
         text: this.translations.t('modal.create'),
         cls: 'mod-cta'
      });
      createButton.addEventListener('click', () => {
         if (!this.url) {
            new Notice(this.translations.t('notices.urlRequired'));
            return;
         }
         this.onSubmit(this.url, this.slug, this.selectedDomain || defaultDomain);
         this.close();
      });
   }

   onClose() {
      const { contentEl } = this;
      contentEl.empty();
   }
}

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
