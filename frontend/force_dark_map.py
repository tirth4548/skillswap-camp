import os
import re

# 1. Update profile.html
profile_path = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/profile.html'
with open(profile_path, 'r', encoding='utf-8') as f:
    profile_content = f.read()

profile_content = profile_content.replace(
    '<div class="glass-card p-0 mb-4 overflow-hidden position-relative" style="height: 600px; background: #050505;">',
    '<div id="neural-map-card" class="glass-card p-0 mb-4 overflow-hidden position-relative" style="height: 600px;">'
)

with open(profile_path, 'w', encoding='utf-8') as f:
    f.write(profile_content)


# 2. Append to index.css
css_path = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/css/index.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

neutral_map_styles = """
/* ===== NEURAL MAP ALWAYS DARK ===== */
#neural-map-card {
    background: #020617 !important;
    border-color: rgba(99, 102, 241, 0.2) !important;
}

#neural-map-card h6 {
    color: #f1f5f9 !important;
}
"""

if '#neural-map-card' not in css_content:
    with open(css_path, 'a', encoding='utf-8') as f:
        f.write('\n' + neutral_map_styles)


# 3. Modify three-neural.js to force dark mode
js_path = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/js/three-neural.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Force this.isLight = false
js_content = js_content.replace("this.isLight = window.getTheme && window.getTheme() === 'light';", "this.isLight = false; // Always dark")

# Remove or disable the theme listener functionality
js_content = re.sub(
    r"window\.addEventListener\('themeChanged',\s*\(e\)\s*=>\s*\{.*?\n        \}\);",
    "window.addEventListener('themeChanged', (e) => {\n            // Intentionally disabled. The map must always remain dark\n        });",
    js_content,
    flags=re.DOTALL
)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Modifications done!")
