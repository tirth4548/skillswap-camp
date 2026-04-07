import os

css_path = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/css/index.css'

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the end of :root block (line 24 "}" then blank line 25)
root_end = content.find('\n\n/* ===== LIGHT MODE OVERRIDES ===== */')
if root_end == -1:
    # Try with \r\n
    root_end = content.find('\r\n\r\n/* ===== LIGHT MODE OVERRIDES ===== */')

# Find where the theme transition section starts (the non-light-mode CSS)
transition_start = content.find('/* ===== THEME TRANSITION ===== */')

# Find the broken appended CSS at the bottom
broken_start = content.find('\r\n\r\n\r\nbody.light-mode .bg-mesh,\r\nbody.light-mode .floating-orb,')
if broken_start == -1:
    broken_start = content.find('\nbody.light-mode .bg-mesh,\nbody.light-mode .floating-orb,')

ultimate_start = content.find('/* ===== ULTIMATE LIGHT MODE FIXES ===== */')

# Get: before light mode, and after light mode (the main CSS), and trim off the broken appended stuff
before_light = content[:root_end]

# The main app CSS starts at transition_start, but we need to find where the broken stuff begins
if ultimate_start != -1:
    main_css_end = content.rfind('\r\n\r\n\r\n\r\nbody.light-mode .bg-mesh,')
    if main_css_end == -1:
        main_css_end = content.rfind('\n\nbody.light-mode .bg-mesh,')
    if main_css_end == -1:
        # Try finding the synergy item hover block end
        main_css_end = content.find('.synergy-item:hover {')
        # Go to end of that block
        main_css_end = content.find('}', main_css_end) + 1
else:
    main_css_end = len(content)

main_css = content[transition_start:main_css_end] if main_css_end > transition_start else content[transition_start:]

# Clean up: remove any previous light-mode selectors from main_css that were incorrectly inserted
# by the regex replacement (body.light-mode selectors mixed in)
import re

# Remove lines with "body.light-mode" selectors from the main CSS since we'll add them properly
lines = main_css.split('\n')
cleaned_lines = []
skip_block = False
brace_count = 0
for line in lines:
    stripped = line.strip()
    if 'body.light-mode' in stripped and not skip_block:
        # This is a light-mode selector line in the wrong place, skip block
        skip_block = True
        brace_count = 0
    if skip_block:
        brace_count += line.count('{') - line.count('}')
        if brace_count <= 0 and '{' in line or '}' in line:
            if brace_count <= 0:
                skip_block = False
            continue
        continue
    cleaned_lines.append(line)

main_css_cleaned = '\n'.join(cleaned_lines)

print(f"Root end at: {root_end}")
print(f"Transition start at: {transition_start}")
print(f"Main CSS end at: {main_css_end}")
print(f"Ultimate start at: {ultimate_start}")
print(f"Before light length: {len(before_light)}")
print(f"Main CSS length: {len(main_css)}")
print("Script analysis done. Will write fix next.")
