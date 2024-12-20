import { Modal, Setting, App, Plugin, Notice } from 'obsidian';
import { DefaultSettings } from './Settings';
import { Translations } from './Translations';

export class CreateShortLinkModal extends Modal {
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

      // Récupérer le chemin du fichier actif
      const filePath = activeFile.path;

      // Trouver le mapping le plus spécifique qui correspond au chemin du fichier
      let bestMatch: { domain: string, depth: number } = { domain: 'dub.co', depth: -1 };

      this.settings.domainFolderMappings.forEach(mapping => {
         // Si le fichier est dans ce dossier ou un sous-dossier
         if (filePath.startsWith(mapping.folder)) {
            // Calculer la profondeur du dossier mappé
            const depth = mapping.folder.split('/').length;
            
            // Si c'est le mapping le plus spécifique trouvé jusqu'à présent
            if (depth > bestMatch.depth) {
               bestMatch = {
                  domain: mapping.domain,
                  depth: depth
               };
            }
         }
      });

      return bestMatch.domain;
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