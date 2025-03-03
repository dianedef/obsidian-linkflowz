import { EditorView, WidgetType, ViewUpdate, DecorationSet, Decoration } from '@codemirror/view';
import { Range } from '@codemirror/state';
import { Plugin } from 'obsidian';
import { Settings } from './Settings';

class LinkIconWidget extends WidgetType {
    constructor(private url: string) {
        super();
    }

    toDOM() {
        const wrapper = document.createElement('span');
        wrapper.addClass('link-icon-widget');
        
        const img = document.createElement('img');
        img.src = `https://logo.microlink.io/${this.extractDomain(this.url)}`;
        img.addClass('link-favicon');
        img.width = 16;
        img.height = 16;
        
        // Gestion des erreurs de chargement
        img.onerror = () => {
            wrapper.remove();
        };
        
        wrapper.appendChild(img);
        return wrapper;
    }

    private extractDomain(url: string): string {
        try {
            const urlObj = new URL(url);
            // Supprimer le www. si présent
            return urlObj.hostname.replace(/^www\./, '');
        } catch (e) {
            return url;
        }
    }
}

export class LinkIconHandler {
    private plugin: Plugin;
    private decorations: DecorationSet;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.decorations = Decoration.none;
    }

    async update(view: EditorView, settings: Settings) {
        if (!settings.showLinkIcons) {
            this.decorations = Decoration.none;
            return;
        }

        const widgets: Range<Decoration>[] = [];
        const content = view.state.doc.toString();
        
        // Regex pour trouver les liens Markdown
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            const [fullMatch, text, url] = match;
            const from = match.index;
            
            // Ajouter le widget juste avant le texte du lien
            widgets.push(Decoration.widget({
                widget: new LinkIconWidget(url),
                side: -1
            }).range(from));
        }

        this.decorations = Decoration.set(widgets);
    }

    get activeDecorations() {
        return this.decorations;
    }
}

// Styles CSS à ajouter au document
export const LINK_ICON_STYLES = `
.link-icon-widget {
    display: inline-flex;
    align-items: center;
    margin-right: 4px;
}

.link-favicon {
    border-radius: 2px;
    vertical-align: middle;
}
`; 