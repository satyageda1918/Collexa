from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
import models, schemas, database, dependencies, auth, datetime
from websocket_manager import manager # Import the websocket manager

router = APIRouter()

# ==========================================
# ACCOUNTS DEPARTMENT
# ==========================================

@router.get("/financial-summary")
async def get_financial_summary(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ACCOUNT", "ADMIN"]))
):
    fees = db.query(models.Fee).all()
    total_collected = sum(f.paid_amount for f in fees)
    total_pending = sum(f.due_amount for f in fees)
    receipts_count = db.query(models.FeePayment).count()

    return {
        "total_revenue": total_collected,
        "pending_dues": total_pending,
        "receipts_generated": receipts_count
    }

@router.get("/fee-status")
async def get_all_fee_status(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ACCOUNT", "ADMIN"]))
):
    # Enrich fee data with student details for the UI
    fees = db.query(models.Fee).all()
    result = []
    for f in fees:
        student_user = db.query(models.User).filter(models.User.id == f.student_id).first()
        student_name = student_user.name if student_user else "Unknown Student"
        result.append({
            "id": f.id,
            "student_id": f.student_id,
            "student_name": student_name,
            "total_amount": f.total_amount,
            "paid_amount": f.paid_amount,
            "due_amount": f.due_amount
        })
    return result

@router.post("/record-payment")
async def record_payment(
    student_id: int,
    amount: Decimal,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ACCOUNT"]))
):
    fee = db.query(models.Fee).filter(models.Fee.student_id == student_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found for student")
    
    fee.paid_amount += amount
    fee.due_amount -= amount
    
    payment = models.FeePayment(fee_id=fee.id, amount=amount)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    # Broadcast fee update
    await manager.broadcast("FEES_UPDATED")
    
    return {"message": "Payment recorded successfully", "receipt_id": payment.id}

@router.get("/account/profile", response_model=schemas.AccountStaff)
async def get_account_profile(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ACCOUNT"]))
):
    profile = db.query(models.AccountStaff).filter(models.AccountStaff.user_id == current_user.id).first()
    if not profile:
        profile = models.AccountStaff(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

# ==========================================
# ADMISSIONS DEPARTMENT
# ==========================================

@router.get("/admissions", response_model=List[schemas.AdmissionRequest])
async def get_admissions(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMISSION", "ADMIN"]))
):
    return db.query(models.AdmissionRequest).all()

@router.post("/admissions/{request_id}/approve")
async def approve_admission(
    request_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMISSION", "ADMIN"]))
):
    req = db.query(models.AdmissionRequest).filter(models.AdmissionRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Admission request not found")
    if req.status != "Pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")
    
    req.status = "Approved"
    
    # Auto-generate user account for the new student
    temp_password = f"{req.first_name}@123"
    db_user = models.User(
        name=f"{req.first_name} {req.last_name}",
        email=req.email,
        hashed_password=auth.get_password_hash(temp_password),
        role=models.UserRole.STUDENT
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create empty student profile
    student = models.Student(
        user_id=db_user.id,
        department=req.desired_course,
        year=1,
        section="A",
        phone_number=req.phone_number
    )
    db.add(student)
    
    # Create initial fee schema
    fee = models.Fee(
        student_id=db_user.id,
        total_amount=50000.0,
        paid_amount=0.0,
        due_amount=50000.0
    )
    db.add(fee)
    db.commit()
    
    # Broadcast admissions and users update
    await manager.broadcast("ADMISSIONS_UPDATED")
    await manager.broadcast("USERS_UPDATED")
    
    return {"message": "Admission approved. Student account auto-generated.", "temp_password": temp_password}

@router.post("/admissions/{request_id}/reject")
async def reject_admission(
    request_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMISSION", "ADMIN"]))
):
    req = db.query(models.AdmissionRequest).filter(models.AdmissionRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Admission request not found")
    
    req.status = "Rejected"
    db.commit()
    
    await manager.broadcast("ADMISSIONS_UPDATED")
    
    return {"message": "Admission request rejected"}

@router.get("/admission/profile", response_model=schemas.AdmissionStaff)
async def get_admission_profile(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMISSION"]))
):
    profile = db.query(models.AdmissionStaff).filter(models.AdmissionStaff.user_id == current_user.id).first()
    if not profile:
        profile = models.AdmissionStaff(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


# ==========================================
# EXAM CELL / ADMINISTRATION
# ==========================================


@router.get("/exam/profile", response_model=schemas.ExamStaff)
async def get_exam_profile(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["EXAM"]))
):
    profile = db.query(models.ExamStaff).filter(models.ExamStaff.user_id == current_user.id).first()
    if not profile:
        profile = models.ExamStaff(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

# ==========================================
# ADVANCED EXAM CELL OPERATIONS
# ==========================================

@router.get("/exam/config", response_model=schemas.SystemConfig)
async def get_exam_config(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["EXAM", "ADMIN", "TEACHER", "STUDENT"]))
):
    config = db.query(models.SystemConfig).first()
    if not config:
        config = models.SystemConfig(id=1, mark_entry_enabled=False, results_published=False)
        db.add(config)
        db.commit()
    return config

@router.post("/exam/toggle-mark-entry")
async def toggle_mark_entry(
    enabled: bool,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["EXAM", "ADMIN"]))
):
    config = db.query(models.SystemConfig).first()
    if not config:
        config = models.SystemConfig(id=1, mark_entry_enabled=enabled, results_published=False)
        db.add(config)
    else:
        config.mark_entry_enabled = enabled
    
    db.commit()
    # Broadcast to teachers to refresh their state
    await manager.broadcast("CONFIG_UPDATED")
    return {"message": f"Mark entry {'enabled' if enabled else 'disabled'} successfully", "enabled": enabled}

@router.get("/exam/question-papers", response_model=List[schemas.QuestionPaper])
async def get_question_papers(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["EXAM", "ADMIN", "TEACHER"]))
):
    return db.query(models.QuestionPaper).all()

@router.get("/exam/marks-for-review", response_model=List[schemas.Mark])
async def get_marks_for_review(
    academic_year: Optional[str] = None,
    semester: Optional[int] = None,
    exam_type: Optional[str] = None,
    department: Optional[str] = None,
    section: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["EXAM", "ADMIN"]))
):
    query = db.query(models.Mark)
    if academic_year: query = query.filter(models.Mark.academic_year == academic_year)
    if semester: query = query.filter(models.Mark.semester == semester)
    if exam_type: query = query.filter(models.Mark.exam_type == exam_type)
    if department and department != "All Departments": query = query.filter(models.Mark.department == department)
    if section and section != "All Sections": query = query.filter(models.Mark.section == section)
    return query.all()

@router.post("/exam/approve-marks")
async def approve_marks(
    mark_ids: List[int],
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["EXAM", "ADMIN"]))
):
    db.query(models.Mark).filter(models.Mark.id.in_(mark_ids)).update({"status": "Approved"}, synchronize_session=False)
    db.commit()
    return {"message": f"{len(mark_ids)} marks approved"}

@router.post("/exam/publish-results")
async def publish_filtered_results(
    academic_year: str,
    semester: int,
    exam_type: str,
    department: str,
    section: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["EXAM", "ADMIN"]))
):
    query = db.query(models.Mark).filter(
        models.Mark.academic_year == academic_year,
        models.Mark.semester == semester,
        models.Mark.exam_type == exam_type,
        models.Mark.status == "Approved"
    )
    if department != "All Departments": query = query.filter(models.Mark.department == department)
    if section != "All Sections": query = query.filter(models.Mark.section == section)
    
    count = query.count()
    query.update({"status": "Published"}, synchronize_session=False)
    
    db.commit()
    await manager.broadcast("CONFIG_UPDATED") # Notify students to check results
    return {"message": f"Results published for {count} subjects/students"}

@router.post("/exam/generate-paper")
async def generate_question_paper(
    paper: schemas.QuestionPaperCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["EXAM", "ADMIN"]))
):
    new_paper = models.QuestionPaper(**paper.dict())
    new_paper.file_url = f"/cdn/papers/QP_{paper.subject_code}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    db.add(new_paper)
    db.commit()
    db.refresh(new_paper)
    return new_paper

@router.post("/exam/issue-supplementary-notice")
async def issue_supplementary(
    title: str,
    message: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["EXAM", "ADMIN"]))
):
    # Broadcast notice to all students
    students = db.query(models.Student).all()
    for s in students:
        notif = models.Notification(
            student_id=s.user_id,
            title=f"SUPPLEMENTARY: {title}",
            message=message
        )
        db.add(notif)
    
    db.commit()
    await manager.broadcast("NEW_NOTIFICATION")
    return {"message": "Supplementary notifications issued to all students"}

# Note: Faculty Mark operations now handled in teacher.py for portal separation
