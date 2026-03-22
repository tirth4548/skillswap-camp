import os

def fix_null_bytes(root_dir):
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.py'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'rb') as f:
                        data = f.read()
                    
                    if b'\x00' in data:
                        print(f"Fixing null bytes in: {path}")
                        clean_data = data.replace(b'\x00', b'')
                        with open(path, 'wb') as f:
                            f.write(clean_data)
                except Exception as e:
                    print(f"Error processing {path}: {e}")

if __name__ == "__main__":
    fix_null_bytes('c:\\Users\\HP\\OneDrive\\Desktop\\skill\\backend')
    print("Cleanup complete.")
