import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'skillswap.db')
print(f"Connecting to database at: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Add max_members to startups
    try:
        cursor.execute("ALTER TABLE startups ADD COLUMN max_members INTEGER DEFAULT 5")
        print("Successfully added 'max_members' to 'startups' table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
            print("'max_members' column already exists.")
        else:
            print(f"Error adding column: {e}")

    # 2. Create startup_requests table
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS startup_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            startup_id INTEGER,
            user_id INTEGER,
            status VARCHAR DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (startup_id) REFERENCES startups(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)
        print("Ensured 'startup_requests' table exists.")
    except sqlite3.OperationalError as e:
        print(f"Error creating table: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")
except Exception as e:
    print(f"Migration failed: {e}")
