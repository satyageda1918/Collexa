from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, dependencies, auth
from websocket_manager import manager # Import the websocket manager

router = APIRouter()

# ==========================================
# ACCOUNTS DEPARTMENT
# ==========================================

@router.get("/financial-summary")
async def get_financial_summary(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["OFFICE", "ADMIN"]))
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
    current_user: models.User = Depends(dependencies.RoleChecker(["OFFICE", "ADMIN"]))
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
    amount: float,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["OFFICE"]))
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

# ==========================================
# ADMISSIONS DEPARTMENT
# ==========================================

@router.get("/admissions", response_model=List[schemas.AdmissionRequest])
async def get_admissions(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["OFFICE", "ADMIN"]))
):
    return db.query(models.AdmissionRequest).all()

@router.post("/admissions/{request_id}/approve")
async def approve_admission(
    request_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["OFFICE", "ADMIN"]))
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
    current_user: models.User = Depends(dependencies.RoleChecker(["OFFICE", "ADMIN"]))
):
    req = db.query(models.AdmissionRequest).filter(models.AdmissionRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Admission request not found")
    
    req.status = "Rejected"
    db.commit()
    
    await manager.broadcast("ADMISSIONS_UPDATED")
    
    return {"message": "Admission request rejected"}


# ==========================================
# EXAM CELL / ADMINISTRATION
# ==========================================

@router.get("/leaves", response_model=List[schemas.LeaveRequest])
async def get_all_leaves(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["OFFICE", "ADMIN"]))
):
    return db.query(models.LeaveRequest).order_by(models.LeaveRequest.created_at.desc()).all()

@router.post("/leaves/{leave_id}/action")
async def action_leave_request(
    leave_id: int,
    action: schemas.LeaveRequestUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["OFFICE", "ADMIN"]))
):
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if action.status not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid action status")

    leave.status = action.status
    db.commit()
    
    # Notify the user
    notification = models.Notification(
        student_id=leave.student_id,
        title=f"Leave {action.status}",
        message=f"Your leave request starting {leave.start_date} has been {action.status.lower()}."
    )
    db.add(notification)
    db.commit()

    # Broadcast leave update to dashboard and notify student
    await manager.broadcast("LEAVES_UPDATED")
    await manager.send_personal_message("NEW_NOTIFICATION", leave.student_id)

    return {"message": f"Leave {action.status.lower()} successfully"}
