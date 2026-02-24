import sys
from database import engine
from sqlalchemy import inspect

insp = inspect(engine)
all_tables = insp.get_table_names()
print("All tables:", all_tables, flush=True)

for table in ['users', 'students', 'fees']:
    cols = [c['name'] for c in insp.get_columns(table)]
    print(f"{table} columns: {cols}", flush=True)

from sqlalchemy.orm import Session
import models

with Session(engine) as db:
    try:
        test_user = models.User(
            name="Debug Test",
            email="debug_test_XXXXXX@test.com",
            hashed_password="fakehash",
            role=models.UserRole.STUDENT
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"User created ID: {test_user.id}", flush=True)
        
        student = models.Student(
            user_id=test_user.id,
            department="CSE",
            year=1,
            section="A"
        )
        db.add(student)
        db.commit()
        print("Student profile OK!", flush=True)
        
        # Cleanup
        db.delete(student)
        db.delete(test_user)
        db.commit()
        print("Cleanup done.", flush=True)
        
    except Exception as e:
        import traceback
        db.rollback()
        err = traceback.format_exc()
        sys.stdout.write("ERROR: " + str(e) + "\n")
        sys.stdout.write(err + "\n")
        sys.stdout.flush()

        # Try to cleanup orphaned user
        try:
            u = db.query(models.User).filter(models.User.email=="debug_test_XXXXXX@test.com").first()
            if u:
                db.delete(u)
                db.commit()
                print("Cleaned up orphan user")
        except:
            pass
