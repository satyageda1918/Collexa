from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, auth

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
                "name": "Office User",
                "email": "office@college.com",
                "password": "Office@123",
                "role": models.UserRole.OFFICE
            }
        ]

        for u in users_to_seed:
            db_user = db.query(models.User).filter(models.User.email == u["email"]).first()
            if db_user:
                print(f"User {u['email']} found, updating password and role...")
                db_user.hashed_password = auth.get_password_hash(u["password"])
                db_user.role = u["role"]
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
                
                # Add profiles for Student and Teacher
                if u["role"] == models.UserRole.STUDENT:
                    student = models.Student(
                        user_id=db_user.id,
                        department="Computer Science",
                        year=3,
                        section="A",
                        gpa=3.8
                    )
                    db.add(student)
                    # Add initial fee record
                    fee = models.Fee(
                        student_id=db_user.id,
                        total_amount=50000.0,
                        paid_amount=15000.0,
                        due_amount=35000.0
                    )
                    db.add(fee)
                    
                    # Add dummy marks
                    db.add(models.Mark(student_id=db_user.id, subject_id=1, semester=5, internal_marks=22, external_marks=65))
                    db.add(models.Mark(student_id=db_user.id, subject_id=2, semester=5, internal_marks=24, external_marks=68))
                    
                    # Add dummy attendance
                    import datetime
                    db.add(models.Attendance(student_id=db_user.id, subject_id=1, hour_slot=1, status="Present", date=datetime.date.today()))
                    db.add(models.Attendance(student_id=db_user.id, subject_id=2, hour_slot=2, status="Present", date=datetime.date.today()))
                    
                    # Add dummy leave request
                    db.add(models.LeaveRequest(student_id=db_user.id, reason="Medical", start_date=datetime.date.today(), end_date=datetime.date.today(), status="Approved"))

                    # Add dummy notifications
                    db.add(models.Notification(student_id=db_user.id, title="Welcome!", message="Welcome to the new Student Portal. Explore your attendance, marks, and more."))
                    db.add(models.Notification(student_id=db_user.id, title="Leave Approved", message="Your leave request for Medical reason has been approved."))
                    db.add(models.Notification(student_id=db_user.id, title="Fee Reminder", message="Please pay your outstanding dues of ₹35000 before the end of the month."))

                elif u["role"] == models.UserRole.TEACHER:
                    teacher = models.Teacher(
                        user_id=db_user.id,
                        department="Computer Science",
                        phone_number="9876543210",
                        address="CS Building, Room 402"
                    )
                    db.add(teacher)
                
                db.commit()

        # Add mock admission requests
        try:
            if db.query(models.AdmissionRequest).count() == 0:
                print("Seeding mock Admission Requests...")
                req1 = models.AdmissionRequest(
                    first_name="Alice", last_name="Johnson", email="alice@example.com",
                    phone_number="1112223333", desired_course="Computer Science", previous_gpa=3.9
                )
                req2 = models.AdmissionRequest(
                    first_name="Bob", last_name="Smith", email="bob@example.com",
                    phone_number="4445556666", desired_course="Mechanical Eng", previous_gpa=3.2
                )
                db.add(req1)
                db.add(req2)
                db.commit()
        except Exception as e:
            print(f"Error seeding admissions: {e}")

        # Add mock leave request if none exist (for Admin/Exam Cell to approve)
        try:
            if db.query(models.LeaveRequest).count() == 1: # We seeded 1 approved leave previously
                import datetime
                print("Seeding pending Leave Request for Office approval...")
                pending_leave = models.LeaveRequest(
                    student_id=db.query(models.User).filter_by(role=models.UserRole.STUDENT).first().id,
                    reason="Family Emergency",
                    start_date=datetime.date.today(),
                    end_date=datetime.date.today() + datetime.timedelta(days=2),
                    status="Pending"
                )
                db.add(pending_leave)
                db.commit()
        except Exception as e:
            print(f"Error seeding leaves: {e}")

        print("Database seeded/updated successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
