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
                        section="A"
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
                elif u["role"] == models.UserRole.TEACHER:
                    teacher = models.Teacher(
                        user_id=db_user.id,
                        department="Computer Science"
                    )
                    db.add(teacher)
                
                db.commit()

        print("Database seeded/updated successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
