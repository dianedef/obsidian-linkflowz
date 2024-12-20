export function registerStyles() {
const styleEl = document.createElement('style');
styleEl.id = 'MYPLUGIN-styles';
styleEl.textContent = `
    /* ===== CSS ===== */
`;

document.head.appendChild(styleEl);
}

export function unregisterStyles() {
const styleEl = document.getElementById('youtube-player-styles');
if (styleEl) {
    styleEl.remove();
}
} 