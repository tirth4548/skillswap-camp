import sqlite3
import os

db_path = 'skillswap.db'

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Update gigs table
        cursor.execute("ALTER TABLE gigs ADD COLUMN is_system BOOLEAN DEFAULT 0")
        print("Added is_system to gigs.")
    except sqlite3.OperationalError as e:
        print(f"Gigs update: {e}")

    try:
        # Update users table
        cursor.execute("ALTER TABLE users ADD COLUMN referral_code TEXT")
        cursor.execute("ALTER TABLE users ADD COLUMN referred_by_id INTEGER REFERENCES users(id)")
        print("Added referral fields to users.")
    except sqlite3.OperationalError as e:
        print(f"Users update: {e}")

    try:
        # Create credit_requests table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS credit_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER REFERENCES users(id),
                receiver_id INTEGER REFERENCES users(id),
                amount INTEGER NOT NULL,
                message TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Created credit_requests table.")
    except sqlite3.OperationalError as e:
        print(f"CreditRequest creation: {e}")

    conn.commit()
    conn.close()
    print("Database migration complete.")
