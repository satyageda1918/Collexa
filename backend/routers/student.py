from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
import datetime
import models, schemas, database, dependencies
from websocket_manager import manager

router = APIRouter()

@router.get("/profile", response_model=schemas.User)
async def get_profile(current_user: models.User = Depends(dependencies.get_current_user)):
    return current_user

@router.put("/profile", response_model=schemas.User)
async def update_profile(
    student_update: schemas.StudentUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    # Update User info
    if student_update.name:
        current_user.name = student_update.name
    if student_update.email:
        current_user.email = student_update.email
    
    # Update Student info
    student = current_user.student_profile
    if not student:
        # Should not happen for STUDENT role, but for safety
        student = models.Student(user_id=current_user.id)
        db.add(student)
    
    if student_update.phone_number:
        student.phone_number = student_update.phone_number
    if student_update.address:
        student.address = student_update.address
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/notifications", response_model=List[schemas.Notification])
async def get_notifications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    return db.query(models.Notification).filter(
        models.Notification.student_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).all()

@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.student_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.get("/attendance", response_model=List[schemas.Attendance])
async def get_attendance(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    return db.query(models.Attendance).filter(models.Attendance.student_id == current_user.id).all()

@router.get("/marks", response_model=List[schemas.Mark])
async def get_marks(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    return db.query(models.Mark).filter(
        models.Mark.student_id == current_user.id,
        models.Mark.status == "Published"
    ).all()

@router.get("/fees", response_model=List[schemas.Fee])
async def get_fees(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    return db.query(models.Fee).filter(models.Fee.student_id == current_user.id).all()


@router.post("/pay-fee")
async def pay_fee(
    amount: Decimal,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    fee = db.query(models.Fee).filter(models.Fee.student_id == current_user.id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found")
    
    if amount > fee.due_amount:
        amount = fee.due_amount
        
    fee.paid_amount += amount
    fee.due_amount -= amount
    
    payment = models.FeePayment(
        fee_id=fee.id,
        amount=amount
    )
    db.add(payment)
    db.commit()
    
    await manager.broadcast("FEES_UPDATED")
    return {"message": f"Payment of {amount} successful", "due_remain": fee.due_amount}


@router.post("/feedback", response_model=schemas.Feedback)
async def submit_feedback(
    feedback: schemas.FeedbackBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    db_feedback = models.Feedback(**feedback.dict(), student_id=current_user.id)
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@router.post("/grievance")
async def submit_grievance(
    grievance: schemas.GrievanceCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    db_grievance = models.Grievance(
        student_id=current_user.id,
        title=grievance.title,
        description=grievance.description,
        category=grievance.category,
        status="Pending"
    )
    db.add(db_grievance)
    db.commit()
    db.refresh(db_grievance)
    return {"message": "Grievance submitted successfully", "id": db_grievance.id}

@router.post("/mark-attendance")
async def mark_attendance(
    request: schemas.AttendanceMarkRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    # Data format: ATTENDANCE|subject_id|hour_slot|teacher_id
    parts = request.qr_code_data.split("|")
    if len(parts) != 4 or parts[0] != "ATTENDANCE":
        raise HTTPException(status_code=400, detail="Invalid QR Code")
    
    subject_id = int(parts[1])
    hour_slot = int(parts[2])
    
    # Check if already marked
    existing = db.query(models.Attendance).filter(
        models.Attendance.student_id == current_user.id,
        models.Attendance.subject_id == subject_id,
        models.Attendance.hour_slot == hour_slot,
        models.Attendance.date == datetime.date.today()
    ).first()
    
    if existing:
        return {"message": "Attendance already marked", "status": "success"}

    attendance = models.Attendance(
        student_id=current_user.id,
        subject_id=subject_id,
        hour_slot=hour_slot,
        status="Present"
    )
    db.add(attendance)
    db.commit()
    
    await manager.broadcast("ATTENDANCE_UPDATED")
    return {"message": "Attendance marked successfully", "status": "success"}
