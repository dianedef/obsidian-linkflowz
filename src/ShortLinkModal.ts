import { Modal, Setting, App, Plugin, Notice, MarkdownView, requestUrl } from 'obsidian';
import { DefaultSettings, Settings } from './Settings';
import { Translations } from './Translations';
import { validateDomainUrl } from './DomainValidations';

interface EditLinkData {
    url: string;
    id: string;
    domain: string;
    key?: string;
}

export class CreateShortLinkModal extends Modal {
    private url: string = '';
    private slug: string = '';
    private selectedDomain: string = '';
    private anchor: string = '';
    private domains: string[] = [];
    private isEditing: boolean = false;
    private editData: EditLinkData | null = null;

    constructor(
        app: App,
        private plugin: Plugin,
        private settings: DefaultSettings,
        private translations: Translations,
        editData?: EditLinkData
    ) {
        super(app);
        if (editData) {
            this.isEditing = true;
            this.editData = editData;
            this.url = editData.url;
            this.selectedDomain = editData.domain;
            this.slug = editData.key || '';
        }
    }

    async onOpen() {
        // Si on est en mode édition, récupérer les détails complets du lien
        if (this.isEditing && this.editData) {
            try {
                const response = await requestUrl({
                    url: `https://api.dub.co/links/${this.editData.id}`,
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.settings.dubApiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 200) {
                    const linkDetails = response.json;
                    this.url = linkDetails.url;
                    this.selectedDomain = linkDetails.domain;
                    this.slug = linkDetails.key || '';
                    this.editData = {
                        ...this.editData,
                        ...linkDetails
                    };
                }
            } catch (error) {
                console.error('Error fetching link details:', error);
                new Notice(this.translations.t('notices.error').replace('{message}', 'Failed to load link details'));
            }
        }

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

        contentEl.createEl("h2", { 
            text: this.translations.t(this.isEditing ? 'modal.editShortLink' : 'modal.createShortLink') 
        });

        // URL de destination
        new Setting(contentEl)
            .setName(this.translations.t('modal.destinationUrl'))
            .setDesc(this.translations.t('modal.destinationUrlDesc'))
            .addText(text => text
                .setValue(this.url)
                .setPlaceholder('https://exemple.com/page-longue')
                .onChange(value => this.url = value));

        // Texte du lien (ancre)
        new Setting(contentEl)
            .setName(this.translations.t('modal.anchor'))
            .setDesc(this.translations.t('modal.anchorDesc'))
            .addText(text => text
                .setValue(this.anchor)
                .setPlaceholder(this.translations.t('modal.anchorPlaceholder'))
                .onChange(value => this.anchor = value));

        // Slug personnalisé
        new Setting(contentEl)
            .setName(this.translations.t('modal.customSlug'))
            .setDesc(this.translations.t('modal.customSlugDesc'))
            .addText(text => text
                .setValue(this.slug)
                .setPlaceholder('mon-lien')
                .onChange(value => this.slug = value));

        // Domaine personnalisé
        const defaultDomain = this.selectedDomain || this.getDomainForCurrentFile();
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
        buttonContainer.createEl('button', { 
            text: this.translations.t('modal.cancel')
        }).addEventListener('click', () => this.close());
        
        // Bouton Créer/Modifier
        const submitButton = buttonContainer.createEl('button', {
            text: this.translations.t(this.isEditing ? 'modal.edit' : 'modal.create'),
            cls: 'mod-cta'
        });
        submitButton.addEventListener('click', async () => {
            if (!this.url) {
                new Notice(this.translations.t('notices.urlRequired'));
                return;
            }
            if (this.isEditing) {
                await this.updateShortLink();
            } else {
                await this.createShortLink();
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();

        // Rafraîchir le dashboard après la fermeture du modal
        const dashboardLeaf = this.plugin.app.workspace.getLeavesOfType('linkflowz-view')[0];
        if (dashboardLeaf?.view) {
            // @ts-ignore
            dashboardLeaf.view.refresh();
        }
    }

    private getDomainForCurrentFile(): string {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return this.domains[0] || 'dub.sh';

        // Récupérer le chemin du fichier actif
        const filePath = activeFile.path;
        
        // Trouver le mapping le plus spécifique qui correspond au chemin du fichier
        let bestMatch: { domain: string, depth: number } = { domain: this.domains[0] || 'dub.sh', depth: -1 };

        if (this.settings.domainFolderMappings) {
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
        }

        return bestMatch.domain;
    }

    private async createShortLink() {
        try {
            // Valider et formater l'URL
            if (!this.url.startsWith('http://') && !this.url.startsWith('https://')) {
                this.url = 'https://' + this.url;
            }

            // Valider la combinaison domaine/URL
            if (!validateDomainUrl(this.selectedDomain, this.url, this.translations)) {
                return;
            }

            const payload = {
                url: this.url,
                domain: this.selectedDomain,
                ...(this.slug && { key: this.slug }),
                ...(this.settings.dubWorkspaceId && { projectId: this.settings.dubWorkspaceId })
            };

            const response = await requestUrl({
                url: 'https://api.dub.co/links',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.dubApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 200) {
                const shortLink = response.json.shortLink;
                
                const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView && !this.isEditing) {
                    const editor = activeView.editor;
                    const file = activeView.file;

                    if (editor && file) {
                        // Utiliser l'ancre si elle est définie, sinon utiliser l'URL de destination
                        const linkText = this.anchor || this.url;
                        // Créer le nouveau lien Markdown
                        const markdownLink = `[${linkText}](${shortLink})`;
                        
                        // Obtenir la position du curseur
                        const cursor = editor.getCursor();
                        
                        // Insérer le lien à la position du curseur
                        editor.replaceRange(markdownLink, cursor);
                    }
                }
                
                new Notice(this.translations.t('notices.linkCreated'));
                this.close();
            } else {
                throw new Error(`API Error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error creating link:', error);
            new Notice(this.translations.t('notices.error').replace('{message}', error.message));
        }
    }

    private async updateShortLink() {
        try {
            if (!this.editData?.id) {
                throw new Error('No link ID provided for update');
            }

            // Valider et formater l'URL
            if (!this.url.startsWith('http://') && !this.url.startsWith('https://')) {
                this.url = 'https://' + this.url;
            }

            const payload = {
                url: this.url,
                domain: this.selectedDomain,
                ...(this.slug && { key: this.slug })
            };

            const response = await requestUrl({
                url: `https://api.dub.co/links/${this.editData.id}`,
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.settings.dubApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 200) {
                new Notice(this.translations.t('notices.linkUpdated'));
                this.close();
            } else {
                throw new Error(`API Error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error updating link:', error);
            new Notice(this.translations.t('notices.error').replace('{message}', error.message));
        }
    }
}