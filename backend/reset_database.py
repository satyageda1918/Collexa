"""
CAUTION: This script will DROP ALL TABLES and recreate them
Only use this if you want to start fresh with an empty database
All existing data will be LOST!
"""
from database import engine, Base
import models

def reset_database():
    print("⚠️  WARNING: This will delete ALL data in the database!")
    confirm = input("Type 'YES' to continue: ")
    
    if confirm != 'YES':
        print("Operation cancelled.")
        return
    
    print("\nDropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("✓ All tables dropped")
    
    print("\nCreating all tables with correct schema...")
    Base.metadata.create_all(bind=engine)
    print("✓ All tables created")
    
    print("\n✅ Database reset completed!")
    print("Run seed_db.py to populate with default data.")

if __name__ == "__main__":
    reset_database()
