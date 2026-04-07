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
        applyThemeEffects(saved);
    });

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(STORAGE_KEY, next);
        updateToggleIcons(next);
        applyThemeEffects(next);
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: next }));
    }

    function updateToggleIcons(theme) {
        document.querySelectorAll('.theme-toggle .toggle-icon').forEach(icon => {
            icon.textContent = theme === 'dark' ? '🌙' : '☀️';
        });
    }

    /**
     * applyThemeEffects — JS-side suppression of 3D backgrounds.
     * Programmatically hides DOM elements with inline styles that
     * CSS alone can't reliably override (e.g. elements created by
     * Three.js with inline style attributes).
     */
    function applyThemeEffects(theme) {
        const selectors = [
            '.mesh-container',
            '.deep-space-container',
            '#etheral-shadow-container',
            '#dashboard-mesh',
            '#dashboard-nebula',
            '#neural-bg',
            '#hero-canvas-container',
            '.bg-mesh',
            '.floating-orb'
        ];

        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.display = theme === 'light' ? 'none' : '';
            });
        });

        // Also hide all canvas elements in light mode (Three.js creates these)
        if (theme === 'light') {
            document.querySelectorAll('canvas').forEach(c => {
                // Only hide background canvases (those inside fixed containers or body-level)
                const parent = c.parentElement;
                if (parent && (
                    parent.style.position === 'fixed' ||
                    parent.style.position === 'absolute' ||
                    parent.id === 'hero-canvas-container' ||
                    parent.classList.contains('mesh-container') ||
                    parent.classList.contains('deep-space-container') ||
                    parent === document.body
                )) {
                    c.style.display = 'none';
                }
            });
        } else {
            document.querySelectorAll('canvas').forEach(c => {
                c.style.display = '';
            });
        }
    }

    // Expose for other scripts
    window.getTheme = () => document.documentElement.getAttribute('data-theme') || 'dark';
})();
