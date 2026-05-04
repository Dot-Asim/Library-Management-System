import psycopg2
import random

DB_CONFIG = {
    "host": "localhost",
    "port": 5432, # Port from docker-compose
    "user": "ulms_admin",
    "password": "ulms_secret_2026",
}

PAKISTANI_NAMES = [
    ("Muhammad", "Asim"),
    ("Muhammad", "Mubeen"),
    ("Hamza", "Ahmed"),
    ("Ali", "Raza"),
    ("Fatima", "Bibi"),
    ("Ayesha", "Khan"),
    ("Bilal", "Nasir"),
    ("Ahmad", "Hassan")
]

def update_names():
    try:
        # Update Auth DB
        conn_auth = psycopg2.connect(**DB_CONFIG, dbname="lms_auth_db")
        cur_auth = conn_auth.cursor()
        
        cur_auth.execute("SELECT id, email FROM users WHERE role = 'STUDENT'")
        students = cur_auth.fetchall()
        
        print(f"Found {len(students)} students in auth-db to update.")
        
        for user_id, email in students:
            fname, lname = random.choice(PAKISTANI_NAMES)
            cur_auth.execute(
                "UPDATE users SET first_name = %s, last_name = %s WHERE id = %s",
                (fname, lname, user_id)
            )
            print(f"Updated {email} -> {fname} {lname}")
            
        conn_auth.commit()
        cur_auth.close()
        conn_auth.close()

        # Update Member DB
        conn_mem = psycopg2.connect(**DB_CONFIG, dbname="lms_member_db")
        cur_mem = conn_mem.cursor()
        
        # Syncing by email since user_id in auth is UUID but in member it might be string or UUID
        for user_id, email in students:
            # We need to find the same user in member-db
            # Fetch the name we just assigned in auth (or just use the same logic if we store the mapping)
            pass
            
        # Refined approach: Fetch all from member-db and update
        cur_mem.execute("SELECT email FROM members")
        emails = [r[0] for r in cur_mem.fetchall()]
        
        print(f"Syncing {len(emails)} members in member-db...")
        for email in emails:
            # Find the user in auth to get the new name
            conn_auth = psycopg2.connect(**DB_CONFIG, dbname="lms_auth_db")
            c_auth = conn_auth.cursor()
            c_auth.execute("SELECT first_name, last_name FROM users WHERE email = %s", (email,))
            row = c_auth.fetchone()
            if row:
                fname, lname = row
                cur_mem.execute(
                    "UPDATE members SET first_name = %s, last_name = %s WHERE email = %s",
                    (fname, lname, email)
                )
            c_auth.close()
            conn_auth.close()
            
        conn_mem.commit()
        cur_mem.close()
        conn_mem.close()
        
        print("\nSUCCESS: All names updated to Pakistani names and synchronized.")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    update_names()
