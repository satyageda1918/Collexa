"""
Migration script to add missing columns to staff tables
Run this on the new device to sync the database schema
"""
from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as conn:
        try:
            # Add access_level to admission_staff if it doesn't exist
            print("Adding access_level to admission_staff...")
            conn.execute(text("""
                ALTER TABLE admission_staff 
                ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'Standard'
            """))
            conn.commit()
            print("✓ admission_staff.access_level added")
        except Exception as e:
            print(f"admission_staff.access_level: {e}")

        try:
            # Add examination_zone to exam_staff if it doesn't exist
            print("Adding examination_zone to exam_staff...")
            conn.execute(text("""
                ALTER TABLE exam_staff 
                ADD COLUMN IF NOT EXISTS examination_zone VARCHAR(50) DEFAULT 'Main Campus'
            """))
            conn.commit()
            print("✓ exam_staff.examination_zone added")
        except Exception as e:
            print(f"exam_staff.examination_zone: {e}")

        try:
            # Add ledger_access to account_staff if it doesn't exist
            print("Adding ledger_access to account_staff...")
            conn.execute(text("""
                ALTER TABLE account_staff 
                ADD COLUMN IF NOT EXISTS ledger_access BOOLEAN DEFAULT TRUE
            """))
            conn.commit()
            print("✓ account_staff.ledger_access added")
        except Exception as e:
            print(f"account_staff.ledger_access: {e}")

    print("\n✅ Migration completed successfully!")
    print("You can now restart your FastAPI server.")

if __name__ == "__main__":
    print("Starting database migration...\n")
    migrate()
