from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import datetime
import models, schemas, database, dependencies

router = APIRouter()

@router.get("/profile", response_model=schemas.User)
async def get_profile(current_user: models.User = Depends(dependencies.get_current_user)):
    return current_user

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
    return db.query(models.Mark).filter(models.Mark.student_id == current_user.id).all()

@router.get("/fees", response_model=List[schemas.Fee])
async def get_fees(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    return db.query(models.Fee).filter(models.Fee.student_id == current_user.id).all()

@router.post("/leave-request", response_model=schemas.LeaveRequest)
async def create_leave_request(
    leave: schemas.LeaveRequestBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    db_leave = models.LeaveRequest(**leave.dict(), student_id=current_user.id)
    db.add(db_leave)
    db.commit()
    db.refresh(db_leave)
    return db_leave

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

@router.post("/mark-attendance")
async def mark_attendance(
    qr_code_data: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["STUDENT"]))
):
    # Data format: ATTENDANCE|subject_id|hour_slot|teacher_id
    parts = qr_code_data.split("|")
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
    return {"message": "Attendance marked successfully", "status": "success"}
