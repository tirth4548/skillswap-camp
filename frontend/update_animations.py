import os
import re

js_dir = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/js'
files = [
    'hero-background.js',
    'three-neural.js',
    'etheral-shadow.js',
    'dashboard-galaxy.js',
    'dashboard-mesh.js',
    'animations.js'
]

for filename in files:
    filepath = os.path.join(js_dir, filename)
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to find requestAnimationFrame(xxx) and insert the return right after it, if it's not already there.
    # A simple way that covers most cases:
    # Look for 'requestAnimationFrame('
    # and insert 'if (document.body && document.body.classList.contains("light-mode")) return;' on the next line.
    
    if 'document.body.classList.contains("light-mode")' in content:
        continue
    
    # Regex replacement
    # Using a generic approach to find requestAnimationFrame line and append the check
    new_content = re.sub(
        r'(requestAnimationFrame\([^)]+\);?\n)',
        r'\1        if (document.body && document.body.classList.contains("light-mode")) return;\n',
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f'Updated {filename}')
