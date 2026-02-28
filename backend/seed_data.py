from sqlalchemy.orm import Session
import models, auth, database
from database import engine, SessionLocal

def seed():
    db = SessionLocal()
    
    # Check if users already exist
    if db.query(models.User).first():
        print("Data already seeded.")
        return

    # Create default users
    users = [
        {"name": "Admin User", "email": "admin@college.com", "password": "Admin@123", "role": models.UserRole.ADMIN},
        {"name": "Student User", "email": "student@college.com", "password": "Student@123", "role": models.UserRole.STUDENT},
        {"name": "Teacher User", "email": "teacher@college.com", "password": "Teacher@123", "role": models.UserRole.TEACHER},
        {"name": "Admission Dept", "email": "admission@college.com", "password": "Admission@123", "role": models.UserRole.ADMISSION},
        {"name": "Exam Cell", "email": "exam@college.com", "password": "Exam@123", "role": models.UserRole.EXAM},
        {"name": "Account Section", "email": "account@college.com", "password": "Account@123", "role": models.UserRole.ACCOUNT},
    ]

    for u in users:
        db_user = models.User(
            name=u["name"],
            email=u["email"],
            hashed_password=auth.get_password_hash(u["password"]),
            role=u["role"]
        )
        db.add(db_user)
        db.flush() # To get the id
        
        if u["role"] == models.UserRole.STUDENT:
            student = models.Student(user_id=db_user.id, department="CS", year=3, section="A", gpa=3.5)
            db.add(student)
            
            # Add some fee record
            fee = models.Fee(student_id=db_user.id, total_amount=50000.0, paid_amount=20000.0, due_amount=30000.0)
            db.add(fee)
            
        elif u["role"] == models.UserRole.TEACHER:
            teacher = models.Teacher(user_id=db_user.id, department="CS")
            db.add(teacher)

    db.commit()
    print("Seed data created successfully.")
    db.close()

if __name__ == "__main__":
    seed()
