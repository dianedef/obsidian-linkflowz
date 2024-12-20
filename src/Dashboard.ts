import { ItemView, Plugin, WorkspaceLeaf, setIcon, Menu, Modal, Notice } from 'obsidian';
import { Translations } from './Translations';
import { Settings } from './Settings';
import { requestUrl } from 'obsidian';
import { CreateShortLinkModal } from './ShortLinkModal';

export const VIEW_TYPE_DASHBOARD = "linkflowz-view";

interface ShortLink {
    id: string;
    url: string;
    shortUrl: string;
    domain: string;
    clicks: number;
}

export class DashboardView extends ItemView {
    private links: ShortLink[] = [];
    private filteredLinks: ShortLink[] = [];
    private isLoading: boolean = false;
    private searchInput: HTMLInputElement;

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
        const container = this.containerEl;
        container.empty();
        
        // Créer le conteneur principal
        const dashboardContainer = container.createDiv({ cls: 'linkflowz-container' });
        
        // Créer l'en-tête
        const header = dashboardContainer.createEl('div', { cls: 'linkflowz-header' });
        
        // Première ligne : titre et boutons
        const titleRow = header.createEl('div', { cls: 'linkflowz-header-row' });
        titleRow.createEl('h2', { text: this.translations.t('dashboard.title') });
        
        // Boutons dans la première ligne
        const buttons = titleRow.createEl('div', { cls: 'linkflowz-buttons' });
        
        // Bouton de création de lien
        const createButton = buttons.createEl('button', { 
            cls: 'linkflowz-button mod-cta',
            text: this.translations.t('modal.createShortLink')
        });
        setIcon(createButton, 'plus');
        createButton.addEventListener('click', () => this.openCreateLinkModal());

        // Bouton de rafraîchissement
        const refreshButton = buttons.createEl('button', { 
            cls: 'linkflowz-button',
            text: this.translations.t('dashboard.refresh')
        });
        setIcon(refreshButton, 'refresh-cw');
        refreshButton.addEventListener('click', () => this.refresh());
        
        // Deuxième ligne : barre de recherche
        const searchRow = header.createEl('div', { cls: 'linkflowz-header-row' });
        const searchContainer = searchRow.createEl('div', { cls: 'linkflowz-search' });
        this.searchInput = searchContainer.createEl('input', {
            type: 'text',
            cls: 'linkflowz-search-input'
        });
        
        // Ajouter l'icône de recherche
        const searchIcon = searchContainer.createEl('span', { cls: 'linkflowz-search-icon' });
        setIcon(searchIcon, 'search');

        // Écouter les changements dans la recherche
        this.searchInput.addEventListener('input', () => {
            this.filterLinks();
        });
        
        // Créer la section principale
        const content = dashboardContainer.createEl('div', { cls: 'linkflowz-content' });
        
        // Créer la liste des liens
        const linksList = content.createEl('div', { cls: 'linkflowz-links-list' });
        
        // Charger et afficher les liens
        await this.loadLinks(linksList);
    }

    async onClose() {
        this.containerEl.empty();
    }

    async refresh() {
        const content = this.containerEl.querySelector('.linkflowz-links-list');
        if (content) {
            // Ajouter l'animation de fade out
            content.addClass('fade-out');
            
            // Attendre la fin de l'animation
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Attendre un petit délai supplémentaire
            await new Promise(resolve => setTimeout(resolve, 200));
            
            content.empty();
            content.removeClass('fade-out');
            await this.loadLinks(content);
        }
    }

    private async loadLinks(container: HTMLElement) {
        try {
            if (this.isLoading) return;
            this.isLoading = true;

            // Afficher le loader
            container.empty();
            const loader = container.createEl('div', { 
                cls: 'linkflowz-loading',
                text: this.translations.t('dashboard.loading')
            });

            // Charger les liens depuis dub.co
            const settings = await Settings.loadSettings();
            if (!settings.dubApiKey) {
                throw new Error('API key required');
            }

            // Appel à l'API dub.co pour récupérer les liens
            const response = await requestUrl({
                url: `https://api.dub.co/links${settings.dubWorkspaceId ? `?workspaceId=${settings.dubWorkspaceId}` : ''}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${settings.dubApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status !== 200) {
                throw new Error(`API Error: ${response.status} - ${response.text}`);
            }

            const links = await response.json;
            if (!Array.isArray(links)) {
                throw new Error('Invalid API response format: expected array');
            }

            // Mapper les liens avec les informations nécessaires
            this.links = links.map((link: any) => ({
                id: link.id,
                url: link.url,
                shortUrl: link.shortLink,
                domain: link.domain,
                clicks: link.clicks || 0
            }));

            // Supprimer le loader
            loader.remove();

            // Afficher les liens
            if (this.links.length === 0) {
                container.createEl('div', { 
                    cls: 'linkflowz-empty-state',
                    text: this.translations.t('dashboard.noLinks')
                });
                return;
            }

            // Créer la liste des liens
            this.links.forEach(link => this.createLinkElement(container, link));

        } catch (error) {
            console.error('Erreur lors du chargement des liens:', error);
            container.createEl('div', { 
                cls: 'linkflowz-error',
                text: this.translations.t('dashboard.error').replace('{message}', error.message)
            });
        } finally {
            this.isLoading = false;
        }
    }

    private createLinkElement(container: HTMLElement, link: ShortLink) {
        const linkEl = container.createEl('div', { 
            cls: 'linkflowz-link-item',
            attr: { tabindex: '0' }
        });

        // Gestion des événements clavier
        linkEl.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                // Ouvre le lien
                window.open(link.shortUrl, '_blank');
            } else if (e.key === 'ArrowDown') {
                // Focus l'élément suivant
                const next = linkEl.nextElementSibling as HTMLElement;
                if (next) next.focus();
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                // Focus l'élément précédent
                const prev = linkEl.previousElementSibling as HTMLElement;
                if (prev) prev.focus();
                e.preventDefault();
            }
        });

        // En-tête du lien
        const header = linkEl.createEl('div', { cls: 'linkflowz-link-header' });
        
        // URL courte avec icône de copie
        const shortUrlContainer = header.createEl('div', { cls: 'linkflowz-short-url' });
        shortUrlContainer.createEl('a', {
            text: link.shortUrl,
            href: link.shortUrl,
            cls: 'linkflowz-link'
        });
        const copyButton = shortUrlContainer.createEl('button', { 
            cls: 'linkflowz-button-icon',
            attr: { 
                'aria-label': 'Copy URL',
                'tabindex': '0'
            }
        });
        setIcon(copyButton, 'copy');
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(link.shortUrl);
            new Notice(this.translations.t('notices.linkCopied'));
        });

        // Menu d'actions
        const actionsButton = header.createEl('button', { 
            cls: 'linkflowz-button-icon',
            attr: { 
                'aria-label': 'Actions',
                'tabindex': '0'
            }
        });
        setIcon(actionsButton, 'more-vertical');
        actionsButton.addEventListener('click', (event) => {
            const menu = new Menu();
            menu.addItem(item => item
                .setIcon('pencil')
                .setTitle(this.translations.t('modal.edit'))
                .onClick(() => {
                    this.editLink(link);
                }));
            menu.addItem(item => item
                .setIcon('trash')
                .setTitle(this.translations.t('modal.delete'))
                .onClick(async () => {
                    await this.deleteLink(link.id);
                }));
            menu.showAtMouseEvent(event);
        });

        // Détails du lien
        const details = linkEl.createEl('div', { cls: 'linkflowz-link-details' });
        
        // URL originale
        details.createEl('div', { 
            cls: 'linkflowz-original-url',
            text: link.url
        });

        // Statistiques
        const stats = details.createEl('div', { cls: 'linkflowz-link-stats' });
        stats.createEl('span', { 
            cls: 'linkflowz-stat',
            text: `${link.clicks} clicks`
        });
    }

    private async openCreateLinkModal() {
        const settings = await Settings.loadSettings();
        const modal = new CreateShortLinkModal(
            this.app,
            this.plugin,
            settings,
            this.translations
        );
        modal.open();
    }

    private filterLinks() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const content = this.containerEl.querySelector('.linkflowz-links-list');
        
        if (!content) return;
        
        content.empty();

        if (!searchTerm) {
            this.links.forEach(link => this.createLinkElement(content, link));
            return;
        }

        const filtered = this.links.filter(link => 
            link.url.toLowerCase().includes(searchTerm) ||
            link.shortUrl.toLowerCase().includes(searchTerm) ||
            link.domain.toLowerCase().includes(searchTerm)
        );

        if (filtered.length === 0) {
            content.createEl('div', { 
                cls: 'linkflowz-empty-state',
                text: this.translations.t('dashboard.noSearchResults')
            });
            return;
        }

        filtered.forEach(link => this.createLinkElement(content, link));
    }

    private async deleteLink(linkId: string) {
        try {
            const settings = await Settings.loadSettings();
            if (!settings.dubApiKey) {
                throw new Error('API key required');
            }

            const response = await requestUrl({
                url: `https://api.dub.co/links/${linkId}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${settings.dubApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status !== 200) {
                throw new Error(`API Error: ${response.status}`);
            }

            // Supprimer le lien localement
            this.links = this.links.filter(link => link.id !== linkId);
            
            // Rafraîchir l'affichage
            const content = this.containerEl.querySelector('.linkflowz-links-list');
            if (content) {
                content.addClass('fade-out');
                await new Promise(resolve => setTimeout(resolve, 300));
                content.empty();
                
                if (this.links.length === 0) {
                    content.createEl('div', { 
                        cls: 'linkflowz-empty-state',
                        text: this.translations.t('dashboard.noLinks')
                    });
                } else {
                    this.links.forEach(link => this.createLinkElement(content, link));
                }
                
                content.removeClass('fade-out');
            }

            new Notice(this.translations.t('notices.linkDeleted'));

        } catch (error) {
            console.error('Erreur lors de la suppression du lien:', error);
            new Notice(this.translations.t('notices.error').replace('{message}', error.message));
        }
    }

    private async editLink(link: ShortLink) {
        const settings = await Settings.loadSettings();
        const modal = new CreateShortLinkModal(
            this.app,
            this.plugin,
            settings,
            this.translations,
            {
                url: link.url,
                id: link.id,
                domain: link.domain
            }
        );
        modal.onClose = async () => {
            await this.refresh();
        };
        modal.open();
    }
}

export class DashboardManager {
    constructor(private plugin: Plugin, private translations: Translations) {}

    async openDashboard(mode: 'tab' | 'sidebar' | 'overlay') {
        const existingLeaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD);
        if (existingLeaves.length > 0) {
            this.plugin.app.workspace.revealLeaf(existingLeaves[0]);
            return;
        }

        await this.plugin.viewMode.setView(mode);
    }

    getCurrentLeaf(): WorkspaceLeaf | null {
        const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD);
        return leaves.length > 0 ? leaves[0] : null;
    }
} 