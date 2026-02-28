from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, auth
import datetime

def seed_db():
    # Create tables if they don't exist
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        users_to_seed = [
            {
                "name": "Admin User",
                "email": "admin@college.com",
                "password": "Admin@123",
                "role": models.UserRole.ADMIN
            },
            {
                "name": "Student User",
                "email": "student@college.com",
                "password": "Student@123",
                "role": models.UserRole.STUDENT
            },
            {
                "name": "Teacher User",
                "email": "teacher@college.com",
                "password": "Teacher@123",
                "role": models.UserRole.TEACHER
            },
            {
                "name": "Admission Dept",
                "email": "admission@college.com",
                "password": "Admission@123",
                "role": models.UserRole.ADMISSION
            },
            {
                "name": "Exam Cell",
                "email": "exam@college.com",
                "password": "Exam@123",
                "role": models.UserRole.EXAM
            },
            {
                "name": "Account Section",
                "email": "account@college.com",
                "password": "Account@123",
                "role": models.UserRole.ACCOUNT
            }
        ]

        for u in users_to_seed:
            db_user = db.query(models.User).filter(models.User.email == u["email"]).first()
            if db_user:
                print(f"User {u['email']} found, updating...")
                db_user.hashed_password = auth.get_password_hash(u["password"])
                db_user.role = u["role"]
                db.commit()
                
                # Ensure profiles exist
                if u["role"] == models.UserRole.ADMISSION and not db_user.admission_profile:
                    db.add(models.AdmissionStaff(user_id=db_user.id))
                elif u["role"] == models.UserRole.EXAM and not db_user.exam_profile:
                    db.add(models.ExamStaff(user_id=db_user.id))
                elif u["role"] == models.UserRole.ACCOUNT and not db_user.account_profile:
                    db.add(models.AccountStaff(user_id=db_user.id))
                db.commit()
            else:
                print(f"User {u['email']} not found, seeding...")
                db_user = models.User(
                    name=u["name"],
                    email=u["email"],
                    hashed_password=auth.get_password_hash(u["password"]),
                    role=u["role"]
                )
                db.add(db_user)
                db.commit()
                db.refresh(db_user)
                
                if u["role"] == models.UserRole.STUDENT:
                    student = models.Student(user_id=db_user.id, department="Computer Science", year=3, section="A", gpa=3.8)
                    db.add(student)
                    fee = models.Fee(student_id=db_user.id, total_amount=50000.0, paid_amount=15000.0, due_amount=35000.0)
                    db.add(fee)
                    db.add(models.Mark(student_id=db_user.id, subject_id=1, semester=5, internal_marks=22, external_marks=65))
                    db.add(models.Mark(student_id=db_user.id, subject_id=2, semester=5, internal_marks=24, external_marks=68))
                    db.add(models.Attendance(student_id=db_user.id, subject_id=1, hour_slot=1, status="Present", date=datetime.date.today()))
                    db.add(models.Notification(student_id=db_user.id, title="Welcome!", message="Welcome to the Portal."))
                elif u["role"] == models.UserRole.TEACHER:
                    db.add(models.Teacher(user_id=db_user.id, department="Computer Science", phone_number="9876543210"))
                elif u["role"] == models.UserRole.ADMISSION:
                    db.add(models.AdmissionStaff(user_id=db_user.id))
                elif u["role"] == models.UserRole.EXAM:
                    db.add(models.ExamStaff(user_id=db_user.id))
                elif u["role"] == models.UserRole.ACCOUNT:
                    db.add(models.AccountStaff(user_id=db_user.id))
                
                db.commit()

        # System Config Seeding
        config = db.query(models.SystemConfig).first()
        if not config:
            print("Seeding system config...")
            db.add(models.SystemConfig(id=1, mark_entry_enabled=False, results_published=False))
            db.commit()

        print("Database seeded/updated successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
