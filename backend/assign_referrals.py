import sqlite3
import uuid
import os

db_path = 'skillswap.db'

def assign_referral_codes():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Find users without a referral code
    cursor.execute("SELECT id, username FROM users WHERE referral_code IS NULL OR referral_code = ''")
    users_without_code = cursor.fetchall()

    if not users_without_code:
        print("All users already have referral codes.")
        conn.close()
        return

    print(f"Found {len(users_without_code)} users without referral codes. Assigning now...")

    for user_id, username in users_without_code:
        new_code = str(uuid.uuid4())[:8].upper()
        cursor.execute("UPDATE users SET referral_code = ? WHERE id = ?", (new_code, user_id))
        print(f"Assigned {new_code} to {username}")

    conn.commit()
    conn.close()
    print("All existing users now have referral codes.")

if __name__ == "__main__":
    assign_referral_codes()
