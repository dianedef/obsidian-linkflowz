import { Modal, Setting, App, Plugin, Notice, MarkdownView, requestUrl } from 'obsidian';
import { DefaultSettings, Settings } from './Settings';
import { Translations } from './Translations';
import { validateDomainUrl } from './DomainValidations';

export class CreateShortLinkModal extends Modal {
   private url: string = '';
   private slug: string = '';
   private selectedDomain: string = '';
   private anchor: string = '';
   private domains: string[] = [];

   constructor(
      app: App,
      private plugin: Plugin,
      private settings: DefaultSettings,
      private translations: Translations
   ) {
      super(app);
   }

   async onOpen() {
      // Charger les domaines disponibles
      try {
         this.domains = await Settings.getCachedDomains(
            this.settings.dubApiKey,
            this.settings.dubWorkspaceId
         );
      } catch (error) {
         console.error('Error loading domains:', error);
         new Notice(this.translations.t('notices.error').replace('{message}', 'Failed to load available domains'));
         this.close();
         return;
      }

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

      // Texte du lien (ancre)
      new Setting(contentEl)
         .setName(this.translations.t('modal.anchor'))
         .setDesc(this.translations.t('modal.anchorDesc'))
         .addText(text => text
            .setPlaceholder(this.translations.t('modal.anchorPlaceholder'))
            .onChange(value => this.anchor = value));

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
            // Ajouter tous les domaines disponibles
            this.domains.forEach(domain => {
               dropdown.addOption(domain, domain);
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
         this.createShortLink(this.url, this.slug, this.selectedDomain || defaultDomain);
      });
   }

   onClose() {
      const { contentEl } = this;
      contentEl.empty();
   }

   private getDomainForCurrentFile(): string {
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) return this.domains[0] || 'dub.sh';

      // Récupérer le chemin du fichier actif
      const filePath = activeFile.path;

      // Trouver le mapping le plus spécifique qui correspond au chemin du fichier
      let bestMatch: { domain: string, depth: number } = { domain: this.domains[0] || 'dub.sh', depth: -1 };

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

   private async createShortLink(url: string, slug: string, domain: string) {
      try {
         console.log('Creating short link with:', { url, slug, domain });
         
         // S'assurer que le domaine est défini
         if (!domain) {
            domain = 'dub.sh';
         }

         // Valider et formater l'URL
         if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
         }

         // Valider la combinaison domaine/URL
         if (!validateDomainUrl(domain, url, this.translations)) {
            return;
         }
         
         // Valider le slug
         if (slug) {
            const slugRegex = /^[a-zA-Z0-9-]+$/;
            if (!slugRegex.test(slug)) {
               new Notice(this.translations.t('notices.error').replace('{message}', 'Le slug ne peut contenir que des lettres, des chiffres et des tirets'));
               return;
            }
            // Vérifier la longueur minimale du slug (4 caractères pour le plan gratuit)
            if (slug.length < 4) {
               new Notice(this.translations.t('notices.error').replace('{message}', 'Le slug doit contenir au moins 4 caractères avec le plan gratuit'));
               return;
            }
         }

         // Vérifier si le domaine est dans la liste des domaines disponibles
         if (!this.domains.includes(domain)) {
            new Notice(this.translations.t('notices.error').replace('{message}', `Le domaine ${domain} n'est pas disponible. Veuillez en choisir un autre.`));
            return;
         }
         
         const payload = {
            url: url,
            domain: domain,
            ...(slug && { key: slug }),
            ...(this.settings.dubWorkspaceId && { projectId: this.settings.dubWorkspaceId })
         };

         console.log('Request payload:', payload);
         
         const response = await requestUrl({
            url: 'https://api.dub.co/links',
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${this.settings.dubApiKey}`,
               'Content-Type': 'application/json',
               'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
         });

         console.log('Response status:', response.status);
         console.log('Response body:', response.json);
         console.log('Response headers:', response.headers);

         if (response.status === 200 || response.status === 201) {
            const shortLink = response.json.shortLink;
            console.log('Created short link:', shortLink);
            
            const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
            
            if (activeView) {
               const editor = activeView.editor;
               const file = activeView.file;

               if (editor && file) {
                  // Utiliser l'ancre si elle est définie, sinon utiliser l'URL de destination
                  const linkText = this.anchor || url;
                  // Créer le nouveau lien Markdown
                  const markdownLink = `[${linkText}](${shortLink})`;
                  
                  console.log('Inserting markdown link:', markdownLink);
                  
                  // Obtenir la position du curseur
                  const cursor = editor.getCursor();
                  
                  // Insérer le lien à la position du curseur
                  editor.replaceRange(markdownLink, cursor);
                  
                  // Mettre à jour les liens dans le cache d'Obsidian
                  this.plugin.app.metadataCache.getFileCache(file);
               }
            }
            
            new Notice(this.translations.t('notices.linkCreated'));
            this.close();
         } else {
            console.error('Error response:', response);
            console.error('Error response body:', response.json);
            let errorMessage = response.json?.error || response.json?.message || 'Unknown error';
            
            // Gérer les erreurs spécifiques
            if (response.status === 409) {
               errorMessage = 'Ce slug est déjà utilisé. Veuillez en choisir un autre.';
            } else if (response.status === 400) {
               errorMessage = 'URL invalide ou paramètres incorrects.';
            } else if (response.status === 401) {
               errorMessage = 'Clé API invalide ou expirée.';
            } else if (response.status === 403) {
               errorMessage = 'Accès refusé. Vérifiez vos permissions.';
            } else if (response.status === 422) {
               console.error('422 Error details:', response.json);
               if (response.json?.code === 'domain_not_found') {
                  errorMessage = `Le domaine ${domain} n'est pas disponible. Veuillez en choisir un autre.`;
                  // Rafraîchir la liste des domaines
                  this.domains = await Settings.getCachedDomains(
                     this.settings.dubApiKey,
                     this.settings.dubWorkspaceId,
                     true // forcer le rafraîchissement
                  );
               } else if (response.json?.code === 'domain_not_allowed') {
                  errorMessage = `Vous n'avez pas accès au domaine ${domain}. Veuillez en choisir un autre.`;
               } else if (response.json?.code === 'invalid_domain') {
                  errorMessage = `Le domaine ${domain} n'est pas valide.`;
               } else {
                  errorMessage = response.json?.message || 'Les données fournies sont invalides. Vérifiez l\'URL et le slug.';
               }
            }
            
            new Notice(this.translations.t('notices.error').replace('{message}', `${errorMessage}`));
         }
      } catch (error) {
         console.error('Erreur lors de la création du lien court:', error);
         if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
         }
         
         let errorMessage = error.message;
         if (errorMessage.includes('status 409')) {
            errorMessage = 'Ce slug est déjà utilisé. Veuillez en choisir un autre.';
         } else if (errorMessage.includes('status 422')) {
            errorMessage = 'Les données fournies sont invalides. Vérifiez l\'URL et le domaine.';
         }
         
         new Notice(this.translations.t('notices.error').replace('{message}', errorMessage));
      }
   }
}