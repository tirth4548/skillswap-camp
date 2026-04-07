import os

css_path = 'assets/css/index.css'
with open(css_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Remove the aggressive canvas hide
text = text.replace(',\n[data-theme="light"] canvas {', ' {')
# Also check for other variations
text = text.replace(',\r\n[data-theme="light"] canvas {', ' {')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Removed aggressive canvas hide.")
