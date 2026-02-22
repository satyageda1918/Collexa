from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import qrcode
import io
import base64
import models, schemas, database, dependencies

router = APIRouter()

@router.get("/students", response_model=List[schemas.User])
async def get_all_students(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["TEACHER", "ADMIN"]))
):
    return db.query(models.User).filter(models.User.role == models.UserRole.STUDENT).all()

@router.post("/generate-qr")
async def generate_attendance_qr(
    subject_id: int,
    hour_slot: int,
    current_user: models.User = Depends(dependencies.RoleChecker(["TEACHER"]))
):
    # In a real app, this would be a signed token
    qr_data = f"ATTENDANCE|{subject_id}|{hour_slot}|{current_user.id}"
    img = qrcode.make(qr_data)
    buf = io.BytesIO()
    img.save(buf)
    img_str = base64.b64encode(buf.getvalue()).decode()
    return {"qr_code": img_str}

@router.post("/leave-request", response_model=schemas.LeaveRequest)
async def teacher_leave_request(
    leave: schemas.LeaveRequestBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["TEACHER"]))
):
    # Simplified: reuse LeaveRequest model for teachers too, or create separate table
    # For now, let's just use it and assume student_id can be any user_id
    db_leave = models.LeaveRequest(**leave.dict(), student_id=current_user.id)
    db.add(db_leave)
    db.commit()
    db.refresh(db_leave)
    return db_leave

@router.get("/class-attendance/{subject_id}/{hour_slot}")
async def get_class_attendance(
    subject_id: int,
    hour_slot: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["TEACHER"]))
):
    # This would typically return all students in the section with their attendance status
    students = db.query(models.User).filter(models.User.role == models.UserRole.STUDENT).all()
    attendance = db.query(models.Attendance).filter(
        models.Attendance.subject_id == subject_id,
        models.Attendance.hour_slot == hour_slot
    ).all()
    
    attended_ids = [a.student_id for a in attendance]
    
    result = []
    for s in students:
        result.append({
            "id": s.id,
            "name": s.name,
            "present": s.id in attended_ids
        })
    return result
