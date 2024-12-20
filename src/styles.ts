const STYLES = `
   .description-with-button {
      margin-bottom: 12px;
   }
   .description-with-button .setting-item-control {
      margin-left: 8px;
   }
   .description-with-button .setting-item-description {
      margin-bottom: 0;
   }
   .mapping-line {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
   }
   .mapping-line .setting-item-control {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-grow: 1;
   }
   .mapping-line .label-text {
      width: 60px !important;
      background: none !important;
      border: none !important;
      box-shadow: none !important;
      font-size: 13px;
      color: var(--text-muted);
      padding: 0 !important;
      cursor: default;
   }
   .mapping-line .domain-dropdown {
      min-width: 200px;
   }
   .folder-container {
      display: flex;
      align-items: center;
      gap: 4px;
   }
   .folder-label {
      font-size: 13px;
      color: var(--text-muted);
   }
   .mapping-line .search-input-container {
      min-width: 150px;
   }
   .add-mapping-button {
      margin-top: 6px;
   }
   .add-mapping-button .setting-item-control {
      justify-content: flex-start;
   }
   .add-mapping-button .setting-item-info {
      display: none;
   }
   .compact-setting .setting-item-info {
      display: none;
   }
`;

export function registerStyles() {
   const styleEl = document.createElement('style');
   styleEl.id = 'linkflowz-styles';
   styleEl.textContent = STYLES;
   document.head.appendChild(styleEl);
}

export function unregisterStyles() {
   const styleEl = document.getElementById('linkflowz-styles');
   if (styleEl) {
      styleEl.remove();
   }
} 