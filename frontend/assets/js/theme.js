/**
 * Theme Toggle — Dark/Light mode with localStorage persistence
 * Loaded BEFORE other scripts so the theme is set before first paint.
 */
(function () {
    const STORAGE_KEY = 'skillswap-theme';

    // Apply saved theme immediately (prevents flash of wrong theme)
    const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    document.addEventListener('DOMContentLoaded', () => {
        // Find all toggle buttons on the page
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            btn.addEventListener('click', toggleTheme);
        });
        updateToggleIcons(saved);
    });

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(STORAGE_KEY, next);
        updateToggleIcons(next);
    }

    function updateToggleIcons(theme) {
        document.querySelectorAll('.theme-toggle .toggle-icon').forEach(icon => {
            icon.textContent = theme === 'dark' ? '🌙' : '☀️';
        });
    }

    // Expose for other scripts
    window.getTheme = () => document.documentElement.getAttribute('data-theme') || 'dark';
})();
