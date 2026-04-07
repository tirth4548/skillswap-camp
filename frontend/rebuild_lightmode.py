"""
Rebuild index.css with complete light mode according to the full spec.
Strategy:
  1. Read current CSS
  2. Keep :root {} block (dark defaults) unchanged
  3. Keep everything from "THEME TRANSITION" to end of the synergy section (component CSS)
  4. Strip out ALL old light-mode overrides (broken ones scattered in the file)
  5. Insert a single, comprehensive light mode block between :root and THEME TRANSITION
  6. Remove all previously appended broken light-mode fixups at the bottom
"""

import re

css_path = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/css/index.css'

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# --- STEP 1: Extract :root block (everything up to and including the closing }) ---
root_match = re.search(r'^(:root\s*\{.*?\})\s*', content, re.DOTALL)
root_block = root_match.group(1) if root_match else ''

# --- STEP 2: Extract main component CSS (from THEME TRANSITION to before any appended broken stuff) ---
transition_idx = content.find('/* ===== THEME TRANSITION ===== */')
assert transition_idx != -1, "Could not find THEME TRANSITION marker"

# Find where the broken appended stuff starts (the duplicate light-mode blocks at bottom)
# Look for the first occurrence of the appended blocks
append_markers = [
    '\nbody.light-mode .bg-mesh,\nbody.light-mode .floating-orb,\nbody.light-mode #bg-canvas,',
    '\r\nbody.light-mode .bg-mesh,\r\nbody.light-mode .floating-orb,\r\nbody.light-mode #bg-canvas,',
    '/* ===== ULTIMATE LIGHT MODE FIXES ===== */',
]

main_css_end = len(content)
for marker in append_markers:
    idx = content.find(marker)
    if idx != -1 and idx < main_css_end:
        # Go back to find a clean line break before it
        main_css_end = idx

main_css = content[transition_idx:main_css_end].rstrip()

# --- STEP 3: Strip out ALL body.light-mode / [data-theme="light"] selectors from main_css ---
# These were incorrectly injected by the regex replacement earlier.
# We'll remove any rule block whose selector contains body.light-mode or [data-theme="light"]
def strip_light_mode_rules(css_text):
    """Remove CSS rule blocks that have light-mode selectors."""
    lines = css_text.split('\n')
    result = []
    skip = False
    brace_depth = 0
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Check if this line starts a light-mode selector block
        if not skip and ('body.light-mode' in stripped or "[data-theme=\"light\"]" in stripped or "[data-theme='light']" in stripped):
            # This is a light-mode rule, skip until the block closes
            skip = True
            brace_depth = 0
            # Count braces on this line
            brace_depth += stripped.count('{') - stripped.count('}')
            if brace_depth <= 0 and '{' in stripped:
                # Single-line rule
                skip = False
            i += 1
            continue
        
        if skip:
            brace_depth += stripped.count('{') - stripped.count('}')
            if brace_depth <= 0:
                skip = False
            i += 1
            continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

main_css_clean = strip_light_mode_rules(main_css)

# Also clean up the body.has-3d-bg rule - we need to keep it but we'll override it in light mode
# Keep it as-is in the main CSS

# --- STEP 4: Build the comprehensive light mode block ---
LIGHT_MODE_CSS = r"""
/* ============================================================
   LIGHT MODE — Complete Override System
   Selector: [data-theme="light"] on <html>
   ============================================================ */

/* --- 4.0  Design Token Overrides --- */
[data-theme="light"] {
    --primary: #4f46e5;
    --primary-glow: rgba(79, 70, 200, 0.25);
    --secondary: #7c3aed;
    --accent: #0284c7;
    --bg-dark: #f8fafc;
    --card-bg: rgba(255, 255, 255, 0.6);
    --glass-border: rgba(226, 232, 240, 0.6);
    --text-primary: #1e293b;
    --text-secondary: #64748b;
}

/* --- 4A  Background System — hide all 3D / mesh / orbs --- */
[data-theme="light"] .bg-mesh {
    background:
        radial-gradient(circle at 0% 0%, rgba(99,102,241,0.08) 0%, transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(168,85,247,0.08) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, #f1f5f9 0%, #f1f5f9 100%);
}

[data-theme="light"] .floating-orb {
    mix-blend-mode: multiply;
    display: none !important;
}

[data-theme="light"] .mesh-container,
[data-theme="light"] .deep-space-container,
[data-theme="light"] #etheral-shadow-container,
[data-theme="light"] #dashboard-mesh,
[data-theme="light"] #dashboard-nebula,
[data-theme="light"] #neural-bg,
[data-theme="light"] #hero-canvas-container,
[data-theme="light"] #bg-canvas,
[data-theme="light"] .neural-network-canvas,
[data-theme="light"] canvas {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
}

/* body.has-3d-bg sets transparent bg — override it */
[data-theme="light"] body.has-3d-bg,
html[data-theme="light"] body.has-3d-bg,
html[data-theme="light"] body {
    background-color: #f8fafc !important;
}

/* --- 4B  Sidebar --- */
[data-theme="light"] .sidebar {
    background: rgba(255, 255, 255, 0.88);
    border-right-color: rgba(226, 232, 240, 0.8);
}

[data-theme="light"] .sidebar-profile {
    background: rgba(241, 245, 249, 0.7);
    border-color: rgba(226, 232, 240, 0.5);
}

[data-theme="light"] .sidebar-profile:hover {
    background: rgba(241, 245, 249, 1);
    border-color: var(--primary);
}

/* --- 4C  Glass Cards --- */
[data-theme="light"] .glass-card {
    background: rgba(255, 255, 255, 0.82) !important;
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(203, 213, 225, 0.45) !important;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04) !important;
}

[data-theme="light"] .glass-card:hover {
    background: rgba(255, 255, 255, 0.92) !important;
    border-color: rgba(79, 70, 229, 0.25) !important;
    box-shadow: 0 12px 40px rgba(79,70,229,0.1), 0 2px 8px rgba(0,0,0,0.04) !important;
    transform: translateY(-5px) scale(1.03) translateZ(0);
}

/* --- 4D  Static Glass --- */
[data-theme="light"] .static-glass {
    background: rgba(255, 255, 255, 0.78) !important;
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(203, 213, 225, 0.4) !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.05) !important;
}

/* --- 4E  Crystal Cards --- */
[data-theme="light"] .crystal-card {
    background: rgba(255, 255, 255, 0.75) !important;
    border-color: rgba(0, 0, 0, 0.08) !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.03) !important;
}

[data-theme="light"] .crystal-card:hover {
    border-color: rgba(79, 70, 229, 0.3) !important;
    box-shadow: 0 10px 35px rgba(0,0,0,0.08), 0 0 15px rgba(79,70,229,0.08) !important;
}

/* --- 4F  Holographic Panels --- */
[data-theme="light"] .holographic-panel {
    background: rgba(255, 255, 255, 0.7) !important;
    border-color: rgba(203, 213, 225, 0.5) !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.04), inset 0 0 10px rgba(255,255,255,0.5) !important;
}

[data-theme="light"] .holographic-panel::after {
    background: linear-gradient(125deg,
        transparent 0%,
        rgba(79,70,229,0.03) 45%,
        rgba(79,70,229,0.06) 50%,
        rgba(79,70,229,0.03) 55%,
        transparent 100%);
}

/* --- 4G  Typography / Text --- */
[data-theme="light"] h1,
[data-theme="light"] h2,
[data-theme="light"] h3,
[data-theme="light"] h4,
[data-theme="light"] h5,
[data-theme="light"] h6 {
    color: #0f172a !important;
}

[data-theme="light"] p,
[data-theme="light"] span,
[data-theme="light"] label,
[data-theme="light"] li {
    color: #1e293b;
}

[data-theme="light"] .fw-bold {
    color: #0f172a;
}

[data-theme="light"] .extra-small,
[data-theme="light"] .small,
[data-theme="light"] small {
    color: #475569;
}

[data-theme="light"] .text-white {
    color: #0f172a !important;
}

[data-theme="light"] .text-white-50 {
    color: #64748b !important;
}

[data-theme="light"] .text-secondary {
    color: #475569 !important;
}

[data-theme="light"] .text-muted {
    color: #64748b !important;
}

/* Keep colored text utilities intact */
[data-theme="light"] .text-primary { color: var(--primary) !important; }
[data-theme="light"] .text-info { color: #0284c7 !important; }
[data-theme="light"] .text-warning { color: #d97706 !important; }
[data-theme="light"] .text-success { color: #166534 !important; }
[data-theme="light"] .text-danger { color: #b91c1c !important; }

/* Holographic header gradient for light mode */
[data-theme="light"] .holographic-header {
    background: linear-gradient(135deg,
        #1e293b 0%,
        #4f46e5 25%,
        #7c3aed 50%,
        #4f46e5 75%,
        #1e293b 100%) !important;
    background-size: 200% auto;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    text-shadow: none !important;
}

/* Kinetic name gradient */
[data-theme="light"] .kinetic-name {
    background: linear-gradient(135deg, #4f46e5, #0284c7) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
}

/* --- 4H  Form Controls --- */
[data-theme="light"] .form-control,
[data-theme="light"] .form-select {
    background-color: #ffffff !important;
    border-color: #cbd5e1 !important;
    color: #0f172a !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

[data-theme="light"] .form-control:focus,
[data-theme="light"] .form-select:focus {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 3px rgba(79,70,229,0.12) !important;
}

[data-theme="light"] .form-control::placeholder,
[data-theme="light"] .form-select::placeholder {
    color: #94a3b8 !important;
}

[data-theme="light"] input,
[data-theme="light"] textarea,
[data-theme="light"] select {
    background-color: #ffffff !important;
    color: #1e293b !important;
    border-color: #cbd5e1 !important;
}

/* --- 4I  Buttons --- */
[data-theme="light"] .btn-outline-light {
    color: #334155;
    border-color: #cbd5e1;
}

[data-theme="light"] .btn-outline-light:hover {
    background-color: #f1f5f9;
    color: #0f172a;
}

[data-theme="light"] .btn-close,
[data-theme="light"] .btn-close-white {
    filter: none;
}

/* --- 4J  Navigation Links --- */
[data-theme="light"] .nav-link-custom {
    color: var(--text-secondary);
}

[data-theme="light"] .nav-link-custom:hover,
[data-theme="light"] .nav-link-custom.active {
    color: var(--text-primary);
    background: rgba(241, 245, 249, 1);
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

[data-theme="light"] .nav-link {
    color: #64748b;
}

[data-theme="light"] .nav-link:hover,
[data-theme="light"] .nav-link.active {
    color: var(--primary);
}

[data-theme="light"] .nav-pills .nav-link.active {
    background-color: var(--primary);
    color: #fff;
}

/* --- 4K  Tables --- */
[data-theme="light"] .table {
    --bs-table-color: #1e293b;
    --bs-table-bg: transparent;
    --bs-table-hover-bg: rgba(241, 245, 249, 0.8);
    color: #1e293b;
}

[data-theme="light"] .table th {
    color: #475569;
    border-bottom-color: #e2e8f0;
}

[data-theme="light"] .table td {
    border-bottom-color: #f1f5f9;
}

[data-theme="light"] .table-dark {
    --bs-table-bg: rgba(255, 255, 255, 0.6) !important;
    --bs-table-color: #0f172a !important;
    --bs-table-hover-bg: rgba(99, 102, 241, 0.05) !important;
    --bs-table-hover-color: #0f172a !important;
    --bs-table-border-color: #e2e8f0 !important;
    background-color: transparent !important;
}

/* --- 4L  Modals --- */
[data-theme="light"] .modal-content {
    background: rgba(255, 255, 255, 0.95) !important;
    border-color: rgba(203, 213, 225, 0.5) !important;
}

[data-theme="light"] .modal-header {
    border-bottom-color: #e2e8f0;
}

[data-theme="light"] .modal-footer {
    border-top-color: #e2e8f0;
}

[data-theme="light"] .modal-content.glass-card {
    background: rgba(255, 255, 255, 0.92) !important;
    backdrop-filter: blur(24px);
}

/* --- 4M  Dropdown Menus --- */
[data-theme="light"] .dropdown-menu {
    background: rgba(255, 255, 255, 0.95);
    border-color: #e2e8f0;
    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}

[data-theme="light"] .dropdown-item {
    color: #334155;
}

[data-theme="light"] .dropdown-item:hover {
    background-color: #f1f5f9;
    color: #0f172a;
}

/* --- 4N  Progress Bars --- */
[data-theme="light"] .progress {
    background: rgba(0, 0, 0, 0.06) !important;
}

/* --- 4O  Kanban Columns --- */
[data-theme="light"] .kanban-col {
    background: rgba(248, 250, 252, 0.8) !important;
    border-color: rgba(203, 213, 225, 0.5) !important;
}

/* --- 4P  Chat Area --- */
[data-theme="light"] .chat-messages {
    background: rgba(248, 250, 252, 0.5);
}

/* --- 4Q  Badges --- */
[data-theme="light"] .badge.bg-dark {
    background-color: #f1f5f9 !important;
    color: #475569 !important;
    border-color: #cbd5e1 !important;
}

/* --- 4R  Credit Badge --- */
[data-theme="light"] .credit-badge {
    background: rgba(251, 191, 36, 0.12);
    border-color: rgba(217, 119, 6, 0.35);
    color: #b45309;
}

/* --- 4S  Synergy Score Ring --- */
[data-theme="light"] .synergy-score-ring {
    color: var(--primary);
    background: rgba(79, 70, 229, 0.08);
}

/* --- 4T  Scrollbar --- */
[data-theme="light"] ::-webkit-scrollbar-track {
    background: #f1f5f9;
}

[data-theme="light"] ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-color: #f1f5f9;
}

[data-theme="light"] ::-webkit-scrollbar-thumb:hover {
    background: var(--primary);
}

/* --- 4V  CRT & HUD Overlays --- */
[data-theme="light"] .crt-overlay {
    display: none !important;
}

[data-theme="light"] .cyber-hud-overlay {
    display: none !important;
}

[data-theme="light"] .corner-bracket {
    opacity: 0.08;
    border-color: var(--secondary);
}

/* --- 4W  Theme Cards --- */
[data-theme="light"] .theme-card {
    border-color: rgba(99, 102, 241, 0.1);
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

[data-theme="light"] .theme-card:hover {
    border-color: rgba(99, 102, 241, 0.25);
    box-shadow: 0 8px 30px rgba(99,102,241,0.12);
}

/* --- 4X  Bootstrap Utility Overrides --- */
[data-theme="light"] .bg-dark {
    background-color: #f8fafc !important;
}

[data-theme="light"] .bg-dark.bg-opacity-25 {
    background-color: rgba(241, 245, 249, 0.7) !important;
}

[data-theme="light"] .bg-dark.bg-opacity-50 {
    background-color: rgba(241, 245, 249, 0.9) !important;
}

[data-theme="light"] .border-secondary {
    border-color: #cbd5e1 !important;
}

[data-theme="light"] .border-secondary.border-opacity-25 {
    border-color: rgba(203, 213, 225, 0.5) !important;
}

[data-theme="light"] .border-secondary.border-opacity-10 {
    border-color: rgba(203, 213, 225, 0.3) !important;
}

/* --- 4Y  Glow Effects (toned down) --- */
[data-theme="light"] .glow-info:hover,
[data-theme="light"] .glow-success:hover,
[data-theme="light"] .glow-primary:hover {
    box-shadow: 0 8px 25px rgba(0,0,0,0.08) !important;
}

/* --- 4Z  Legendary Aura --- */
[data-theme="light"] .legendary-aura {
    animation: none;
    filter: drop-shadow(0 0 4px rgba(217,119,6,0.3));
}

/* --- 4AA Wallet Card (keeps gradient) --- */
[data-theme="light"] .wallet-card {
    background: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
    color: white !important;
}

[data-theme="light"] .wallet-card h1,
[data-theme="light"] .wallet-card h6,
[data-theme="light"] .wallet-card p,
[data-theme="light"] .wallet-card span,
[data-theme="light"] .wallet-card .text-white,
[data-theme="light"] .wallet-card .text-white-50 {
    color: white !important;
}

/* --- 4AB Stat Cards --- */
[data-theme="light"] .stat-card {
    background: rgba(255, 255, 255, 0.85);
}

[data-theme="light"] .stat-card .text-white {
    color: #0f172a !important;
}

[data-theme="light"] .stat-card .holographic-header {
    -webkit-text-fill-color: #0f172a !important;
    background: none !important;
}

/* --- 4AC Inline Style Overrides (catches dark inline backgrounds) --- */
[data-theme="light"] [style*="background: rgba(0,0,0"] {
    background: rgba(255,255,255,0.95) !important;
}

[data-theme="light"] [style*="background: #050505"] {
    background: #f1f5f9 !important;
}

[data-theme="light"] [style*="background: #020617"] {
    background: #f8fafc !important;
}

/* --- Luxury Cards --- */
[data-theme="light"] .luxury-card {
    background: rgba(255, 255, 255, 0.85) !important;
    border-color: rgba(0, 0, 0, 0.05) !important;
}

[data-theme="light"] .luxury-card:hover {
    background: rgba(255, 255, 255, 0.95) !important;
    border-color: rgba(79, 70, 229, 0.3) !important;
}

[data-theme="light"] .luxury-card .text-white {
    color: #1e293b !important;
}

[data-theme="light"] .luxury-card .text-secondary {
    color: #64748b !important;
}

/* --- Mesh Container --- */
[data-theme="light"] .mesh-container {
    background: #f8fafc !important;
    display: none !important;
}

"""

# --- STEP 5: Reassemble the file ---
# We need the main CSS but stripped of broken light-mode injections
final_css = root_block + '\n\n' + LIGHT_MODE_CSS + '\n' + main_css_clean + '\n'

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(final_css)

print(f"SUCCESS: Rebuilt index.css")
print(f"  :root block: {len(root_block)} chars")
print(f"  Light mode block: {len(LIGHT_MODE_CSS)} chars")  
print(f"  Main CSS (cleaned): {len(main_css_clean)} chars")
print(f"  Total: {len(final_css)} chars")
