import sqlite3
import os

db_path = 'skillswap.db'

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Update users table with xp and level
        cursor.execute("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1")
        print("Added XP and Level fields to users.")
    except sqlite3.OperationalError as e:
        print(f"Users update: {e}")

    conn.commit()
    conn.close()
    print("Database migration complete.")
