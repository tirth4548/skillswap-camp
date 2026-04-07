import os

css_path = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/css/index.css'

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

WORKSPACE_GRADIENT_OVERRIDE = """
[data-theme="light"] [style*="background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.05)"] {
    background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent 70%) !important;
}
"""

# Append before the transition block
content = content.replace('/* ===== THEME TRANSITION ===== */', WORKSPACE_GRADIENT_OVERRIDE + '\n/* ===== THEME TRANSITION ===== */')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added Workspace radial gradient override.")
