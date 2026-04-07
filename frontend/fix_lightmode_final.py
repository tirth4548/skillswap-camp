import os

css_path = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/css/index.css'

with open(css_path, 'a', encoding='utf-8') as f:
    f.write('''

/* ===== ULTIMATE LIGHT MODE FIXES ===== */

/* 1. Ensure Body Background is NEVER clear/transparent in light mode */
body.light-mode, 
body.light-mode.has-3d-bg,
[data-theme="light"].has-3d-bg {
    background-color: #f8fafc !important;
    background-image: none !important;
}

/* 2. Hide ALL background canvases and mesh containers rigorously */
body.light-mode canvas,
[data-theme="light"] canvas,
body.light-mode .mesh-container,
[data-theme="light"] .mesh-container,
body.light-mode #etheral-shadow-container,
[data-theme="light"] #etheral-shadow-container,
body.light-mode #dashboard-mesh,
[data-theme="light"] #dashboard-mesh,
body.light-mode #hero-canvas-container,
[data-theme="light"] #hero-canvas-container,
body.light-mode .bg-mesh,
[data-theme="light"] .bg-mesh,
body.light-mode .floating-orb,
[data-theme="light"] .floating-orb,
body.light-mode .neural-network-canvas,
[data-theme="light"] .neural-network-canvas,
body.light-mode .deep-space-container,
[data-theme="light"] .deep-space-container {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
}

/* 3. Forcibly darken ALL typically white/light text classes */
body.light-mode .text-white,
[data-theme="light"] .text-white,
body.light-mode .holographic-header,
[data-theme="light"] .holographic-header,
body.light-mode .stat-card h2,
[data-theme="light"] .stat-card h2,
body.light-mode h1, body.light-mode h2, body.light-mode h3, body.light-mode h4, body.light-mode h5, body.light-mode h6,
[data-theme="light"] h1, [data-theme="light"] h2, [data-theme="light"] h3, [data-theme="light"] h4, [data-theme="light"] h5, [data-theme="light"] h6 {
    color: #0f172a !important;
    text-shadow: none !important;
}

/* Let specific colored text stay their color */
body.light-mode .text-primary { color: var(--primary) !important; }
body.light-mode .text-secondary { color: #475569 !important; }
body.light-mode .text-info { color: #0284c7 !important; }
body.light-mode .text-warning { color: #d97706 !important; }
body.light-mode .text-success { color: #166534 !important; }
body.light-mode .text-danger { color: #b91c1c !important; }

/* 4. Fix glass cards and panels that might be too dark */
body.light-mode .crystal-card,
[data-theme="light"] .crystal-card,
body.light-mode .holographic-panel,
[data-theme="light"] .holographic-panel,
body.light-mode .glass-card,
[data-theme="light"] .glass-card {
    background: rgba(255, 255, 255, 0.85) !important;
    border-color: rgba(226, 232, 240, 1) !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05) !important;
}

/* 5. Inputs and forms */
body.light-mode input, body.light-mode textarea, body.light-mode select,
[data-theme="light"] input, [data-theme="light"] textarea, [data-theme="light"] select {
    background-color: #ffffff !important;
    color: #1e293b !important;
    border-color: #cbd5e1 !important;
}
''')

print("Applied ultimate sledgehammer CSS fixes for Light Mode.")
