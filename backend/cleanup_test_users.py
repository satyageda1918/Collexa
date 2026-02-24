from database import engine
from sqlalchemy.orm import Session
from sqlalchemy import text

test_emails = [
    'unique_email_123@xyz.com', 'unique_email_124151241@xyz.com',
    'unique_email_11119@xyz.com', 'unique_email_2222@xyz.com', 
    'diagtest9999@xyz.com', 'diagtest999993@xyz.com', 'diagtest99991111@xyz.com',
    'zzz9991@xyz.com', 'debug_test_XXXXXX@test.com', 'diagtest123456789@xyz.com'
]

with engine.begin() as conn:
    for email in test_emails:
        # Get user id
        row = conn.execute(text("SELECT id FROM users WHERE email = :e"), {'e': email}).fetchone()
        if row:
            uid = row[0]
            # Delete in proper FK order
            conn.execute(text("DELETE FROM fees WHERE student_id = :uid"), {'uid': uid})
            conn.execute(text("DELETE FROM students WHERE user_id = :uid"), {'uid': uid})
            conn.execute(text("DELETE FROM users WHERE id = :uid"), {'uid': uid})
            print(f"Cleaned up user: {email}")

print("Done.")
