import re

filepath = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/css/index.css'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('body.light-mode, [data-theme="light"] .glass-card,', 'body.light-mode .glass-card, [data-theme="light"] .glass-card,')
content = content.replace('body.light-mode, [data-theme="light"] .nav-link-custom:hover,', 'body.light-mode .nav-link-custom:hover, [data-theme="light"] .nav-link-custom:hover,')
content = content.replace('body.light-mode, [data-theme="light"] .form-control,', 'body.light-mode .form-control, [data-theme="light"] .form-control,')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Cleaned!")
