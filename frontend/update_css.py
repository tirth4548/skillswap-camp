import re

with open('assets/css/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Update basic light theme variables
content = re.sub(r'\[data-theme="light"\]', 'body.light-mode, [data-theme="light"]', content)
content = content.replace('--card-bg: rgba(255, 255, 255, 0.6);', '--card-bg: rgba(255, 255, 255, 0.7);')
content = content.replace('--glass-border: rgba(226, 232, 240, 0.6);', '--glass-border: rgba(226, 232, 240, 0.8);')
content = content.replace('--text-secondary: #64748b;', '--text-secondary: #475569;')

# Hide canvases
hide_css = """
body.light-mode .bg-mesh,
body.light-mode .floating-orb,
body.light-mode #bg-canvas,
body.light-mode .neural-network-canvas,
body.light-mode .deep-space-container {
    display: none !important;
}
"""
if 'body.light-mode .bg-mesh' not in content:
    content += '\n' + hide_css

with open('assets/css/index.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated CSS')
