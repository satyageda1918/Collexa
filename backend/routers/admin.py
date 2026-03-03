from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, dependencies, auth
from websocket_manager import manager # Import the websocket manager

router = APIRouter()

@router.get("/users", response_model=List[schemas.UserDetailed])
async def list_users(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMIN"]))
):
    return db.query(models.User).all()

@router.get("/dashboard-stats")
async def get_dashboard_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMIN"]))
):
    total_students = db.query(models.User).filter(models.User.role == models.UserRole.STUDENT).count()
    total_faculty = db.query(models.User).filter(models.User.role == models.UserRole.TEACHER).count()
    
    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "system_status": "All Systems Go",
        "active_sessions": db.query(models.User).count() # Simplify active sessions as total users for now
    }


@router.post("/users", response_model=schemas.UserDetailed)
async def create_user(
    user_in: schemas.UserCreateExtended,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMIN"]))
):
    # Check if user already exists
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    try:
        # Create User
        db_user = models.User(
            name=user_in.name,
            email=user_in.email,
            hashed_password=auth.get_password_hash(user_in.password),
            role=user_in.role
        )
        db.add(db_user)
        db.flush()  # Get the ID
        
        # Create Profile based on role
        if user_in.role == models.UserRole.STUDENT:
            # Check if roll_number already exists
            if user_in.roll_number:
                existing_roll = db.query(models.Student).filter(
                    models.Student.roll_number == user_in.roll_number
                ).first()
                if existing_roll:
                    raise HTTPException(status_code=400, detail="Roll number already exists")
            
            student = models.Student(
                user_id=db_user.id,
                roll_number=user_in.roll_number,
                department=user_in.department or "General",
                year=user_in.year or 1,
                section=user_in.section or "A",
                phone_number=user_in.phone_number,
                address=user_in.address
            )
            db.add(student)
            # Add initial Fee record
            fee = models.Fee(
                student_id=db_user.id,
                total_amount=50000.0,
                paid_amount=0.0,
                due_amount=50000.0
            )
            db.add(fee)
        elif user_in.role == models.UserRole.TEACHER:
            teacher = models.Teacher(
                user_id=db_user.id,
                department=user_in.department or "General",
                phone_number=user_in.phone_number,
                address=user_in.address
            )
            db.add(teacher)
        elif user_in.role == models.UserRole.ADMISSION:
            db.add(models.AdmissionStaff(user_id=db_user.id))
        elif user_in.role == models.UserRole.EXAM:
            db.add(models.ExamStaff(user_id=db_user.id))
        elif user_in.role == models.UserRole.ACCOUNT:
            db.add(models.AccountStaff(user_id=db_user.id))
        
        db.commit()
        db.refresh(db_user)
        
        await manager.broadcast("USERS_UPDATED")
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMIN"]))
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    db.delete(db_user)
    db.commit()
    
    await manager.broadcast("USERS_UPDATED")
    return {"message": "User deleted successfully"}

@router.put("/users/{user_id}", response_model=schemas.UserDetailed)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMIN"]))
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        # Update User fields
        if user_update.name is not None:
            db_user.name = user_update.name
        if user_update.email is not None:
            # Check if email is already taken by another user
            existing = db.query(models.User).filter(models.User.email == user_update.email, models.User.id != user_id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already taken")
            db_user.email = user_update.email
        if user_update.role is not None:
            db_user.role = user_update.role
        if user_update.password:
            db_user.hashed_password = auth.get_password_hash(user_update.password)

        # Update Profile based on role (even if role didn't change, we update profile fields)
        if db_user.role == models.UserRole.STUDENT:
            student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
            if not student:
                student = models.Student(user_id=user_id)
                db.add(student)
            
            if user_update.department is not None:
                student.department = user_update.department
            if user_update.year is not None:
                student.year = user_update.year
            if user_update.section is not None:
                student.section = user_update.section
            if user_update.phone_number is not None:
                student.phone_number = user_update.phone_number
            if user_update.address is not None:
                student.address = user_update.address
                
        elif db_user.role == models.UserRole.TEACHER:
            teacher = db.query(models.Teacher).filter(models.Teacher.user_id == user_id).first()
            if not teacher:
                teacher = models.Teacher(user_id=user_id)
                db.add(teacher)
            
            if user_update.department is not None:
                teacher.department = user_update.department
            if user_update.phone_number is not None:
                teacher.phone_number = user_update.phone_number
            if user_update.address is not None:
                teacher.address = user_update.address
        
        elif db_user.role == models.UserRole.ADMISSION:
            if not db.query(models.AdmissionStaff).filter(models.AdmissionStaff.user_id == user_id).first():
                db.add(models.AdmissionStaff(user_id=user_id))
        
        elif db_user.role == models.UserRole.EXAM:
            if not db.query(models.ExamStaff).filter(models.ExamStaff.user_id == user_id).first():
                db.add(models.ExamStaff(user_id=user_id))
                
        elif db_user.role == models.UserRole.ACCOUNT:
            if not db.query(models.AccountStaff).filter(models.AccountStaff.user_id == user_id).first():
                db.add(models.AccountStaff(user_id=user_id))

        db.commit()
        db.refresh(db_user)
        
        await manager.broadcast("USERS_UPDATED")
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

