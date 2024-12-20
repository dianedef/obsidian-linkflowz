export function registerStyles() {
const styleEl = document.createElement('style');
styleEl.id = 'linkflowz-styles';
styleEl.textContent = `
    /* Animations */
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    /* Menu Hover Styles */
    .menu.linkflowz-menu {
        position: absolute;
        z-index: 1000;
    }

    /* Dashboard Container */
    .linkflowz-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 1rem;
        gap: 1rem;
    }

    /* Header Styles */
    .linkflowz-header {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--background-modifier-border);
    }

    .linkflowz-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .linkflowz-header h2 {
        margin: 0;
    }

    .linkflowz-buttons {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    /* Toolbar Styles */
    .linkflowz-toolbar {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        width: 100%;
    }

    .linkflowz-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        background-color: var(--interactive-normal);
        border: 1px solid var(--background-modifier-border);
        color: var(--text-normal);
    }

    .linkflowz-button:hover {
        background-color: var(--interactive-hover);
    }

    .linkflowz-button.mod-cta {
        background-color: var(--interactive-accent);
        color: var(--text-on-accent);
    }

    .linkflowz-button.mod-cta:hover {
        background-color: var(--interactive-accent-hover);
    }

    .linkflowz-button-icon {
        padding: 0.25rem;
        border-radius: 4px;
        cursor: pointer;
        background: none;
        border: none;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .linkflowz-button-icon:hover {
        color: var(--text-normal);
        background-color: var(--background-modifier-hover);
    }

    /* Content Styles */
    .linkflowz-content {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 0;
    }

    .linkflowz-links-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        animation: fadeIn 0.3s ease-in-out;
    }

    .linkflowz-links-list.fade-out {
        animation: fadeOut 0.3s ease-in-out;
    }

    /* Link Item Styles */
    .linkflowz-link-item {
        padding: 1rem;
        border-radius: 4px;
        background-color: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
    }

    .linkflowz-link-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .linkflowz-short-url {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .linkflowz-link {
        color: var(--text-accent);
        text-decoration: none;
    }

    .linkflowz-link:hover {
        text-decoration: underline;
    }

    .linkflowz-link-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .linkflowz-original-url {
        color: var(--text-muted);
        font-size: 0.9em;
        word-break: break-all;
    }

    .linkflowz-link-stats {
        display: flex;
        gap: 1rem;
        color: var(--text-muted);
        font-size: 0.9em;
    }

    /* Loading State */
    .linkflowz-loading {
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
    }

    /* Empty State */
    .linkflowz-empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
    }

    /* Error State */
    .linkflowz-error {
        color: var(--text-error);
        padding: 1rem;
        text-align: center;
        background-color: var(--background-modifier-error);
        border-radius: 4px;
    }

    /* Modal Styles */
    .linkflowz-modal {
        max-width: 80vw;
        max-height: 80vh;
        width: 600px;
    }

    /* Search Styles */
    .linkflowz-search {
        width: 100%;
        display: flex;
        align-items: center;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background-color: var(--background-primary);
    }

    .linkflowz-search-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        color: var(--text-muted);
    }

    .linkflowz-search-input {
        flex: 1;
        padding: 0.5rem;
        border: none;
        background: none;
        color: var(--text-normal);
    }

    .linkflowz-search-input:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--background-modifier-border);
    }
`;

document.head.appendChild(styleEl);
}

export function unregisterStyles() {
const styleEl = document.getElementById('linkflowz-styles');
if (styleEl) {
    styleEl.remove();
}
} 