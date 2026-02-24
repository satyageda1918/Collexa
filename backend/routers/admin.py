from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, dependencies, auth
from websocket_manager import manager # Import the websocket manager

router = APIRouter()

@router.get("/users", response_model=List[schemas.User])
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


@router.post("/users", response_model=schemas.User)
async def create_user(
    user_in: schemas.UserCreateExtended,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMIN"]))
):
    # Check if user already exists
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    try:
        # Create User (don't commit yet)
        db_user = models.User(
            name=user_in.name,
            email=user_in.email,
            hashed_password=auth.get_password_hash(user_in.password),
            role=user_in.role
        )
        db.add(db_user)
        db.flush()  # Get the ID without committing
        
        # Create Profile based on role (using the flushed ID)
        if user_in.role == models.UserRole.STUDENT:
            student = models.Student(
                user_id=db_user.id,
                department=user_in.department or "General",
                year=user_in.year or 1,
                section=user_in.section or "A"
            )
            db.add(student)
            # Add initial Fee record for student
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
                department=user_in.department or "General"
            )
            db.add(teacher)
        
        # Single commit for all changes atomically
        db.commit()
        db.refresh(db_user)
        
        await manager.broadcast("USERS_UPDATED")
        return db_user
    except HTTPException:
        db.rollback()
        raise
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

@router.put("/users/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMIN"]))
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for var, value in vars(user_update).items():
        if value is not None:
            setattr(db_user, var, value)
    
    db.commit()
    db.refresh(db_user)
    
    await manager.broadcast("USERS_UPDATED")
    return db_user

@router.get("/leave-requests", response_model=List[schemas.LeaveRequest])
async def list_all_leave_requests(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMIN"]))
):
    return db.query(models.LeaveRequest).all()

@router.post("/leave-requests/{leave_id}/approve")
async def approve_leave(
    leave_id: int,
    status: str, # Approved/Rejected
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMIN"]))
):
    db_leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not db_leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    db_leave.status = status
    db.commit()
    
    await manager.broadcast("LEAVES_UPDATED")
    await manager.send_personal_message("NEW_NOTIFICATION", db_leave.student_id)
    
    return {"message": f"Leave request {status}"}
