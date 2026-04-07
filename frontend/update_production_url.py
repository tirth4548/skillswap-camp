import os

js_dir = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/js'

old_url = 'http://127.0.0.1:8000'
new_url = 'https://skillswap-api-p79d.onrender.com'

files_updated = 0

for filename in os.listdir(js_dir):
    if filename.endswith('.js'):
        filepath = os.path.join(js_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
        
        if old_url in content:
            updated_content = content.replace(old_url, new_url)
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(updated_content)
            files_updated += 1
            print(f"Updated: {filename}")

print(f"Update complete! {files_updated} files modified to point to production API.")
