import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'skillswap.db')
print(f"Connecting to database at: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Add request_type to startup_requests
    try:
        cursor.execute("ALTER TABLE startup_requests ADD COLUMN request_type VARCHAR DEFAULT 'join'")
        print("Successfully added 'request_type' to 'startup_requests' table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
            print("'request_type' column already exists.")
        else:
            print(f"Error adding column: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")
except Exception as e:
    print(f"Migration failed: {e}")
