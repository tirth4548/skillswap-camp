import os

css_path = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/css/index.css'

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The CSS block to insert
TOGGLE_CSS = """
/* --- 5. Theme Toggle Button UI --- */
[data-theme="light"] .theme-toggle {
    background: rgba(99, 102, 241, 0.1);
}

[data-theme="light"] .theme-toggle .toggle-knob {
    transform: translateX(24px);
    background: linear-gradient(135deg, #f59e0b, #f97316);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
}
"""

content = content.replace('/* ===== THEME TRANSITION ===== */', TOGGLE_CSS + '\n/* ===== THEME TRANSITION ===== */')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added Toggle UI CSS successfully.")
