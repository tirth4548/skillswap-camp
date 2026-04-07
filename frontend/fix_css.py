import os
import re

filepath = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/css/index.css'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # If the line contains "body.light-mode, [data-theme="light"]" followed by some selector like " .bg-mesh"
    # We should fix it to "body.light-mode .bg-mesh, [data-theme="light"] .bg-mesh"
    
    # Check if the line has the signature of the broken replacement
    match = re.search(r'^body\.light-mode, \[data-theme="light"\](.*) {', line)
    if match and len(match.group(1).strip()) > 0:
        suffix = match.group(1)
        fixed_line = f'body.light-mode{suffix}, [data-theme="light"]{suffix} {{\n'
        new_lines.append(fixed_line)
    else:
        new_lines.append(line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Fixed CSS syntax')
