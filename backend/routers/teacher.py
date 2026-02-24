from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import qrcode
import io
import base64
import models, schemas, database, dependencies

router = APIRouter()

@router.get("/profile", response_model=schemas.User)
async def get_teacher_profile(current_user: models.User = Depends(dependencies.RoleChecker(["TEACHER"]))):
    return current_user

@router.put("/profile", response_model=schemas.User)
async def update_teacher_profile(
    teacher_update: schemas.TeacherUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["TEACHER"]))
):
    if teacher_update.name:
        current_user.name = teacher_update.name
    if teacher_update.email:
        current_user.email = teacher_update.email
    
    teacher = current_user.teacher_profile
    if not teacher:
        teacher = models.Teacher(user_id=current_user.id)
        db.add(teacher)
    
    if teacher_update.phone_number:
        teacher.phone_number = teacher_update.phone_number
    if teacher_update.address:
        teacher.address = teacher_update.address
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/dashboard-stats")
async def get_dashboard_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["TEACHER"]))
):
    total_students = db.query(models.User).filter(models.User.role == models.UserRole.STUDENT).count()
    # Mocking active classes for now, we can base it on schedule later
    active_classes = 3
    pending_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "Pending").count()
    
    return {
        "total_students": total_students,
        "active_classes": active_classes,
        "pending_leaves": pending_leaves
    }

@router.get("/students", response_model=List[schemas.StudentWithAttendance])
async def get_all_students(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["TEACHER", "ADMIN"]))
):
    students = db.query(models.User).filter(models.User.role == models.UserRole.STUDENT).all()
    result = []
    
    for s in students:
        # Get total attendance records for this student
        total_records = db.query(models.Attendance).filter(models.Attendance.student_id == s.id).count()
        present_count = db.query(models.Attendance).filter(
            models.Attendance.student_id == s.id,
            models.Attendance.status == 'Present'
        ).count()
        
        # Calculate percentage (default to 100 if no records yet)
        percentage = 100.0
        if total_records > 0:
            percentage = (present_count / total_records) * 100.0
            
        student_data = schemas.StudentWithAttendance(
            id=s.id,
            name=s.name,
            email=s.email,
            role=s.role,
            created_at=s.created_at,
            attendance_percentage=round(percentage, 1)
        )
        result.append(student_data)
        
    return result

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
