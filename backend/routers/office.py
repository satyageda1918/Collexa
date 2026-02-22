from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, dependencies

router = APIRouter()

@router.get("/fee-status", response_model=List[schemas.Fee])
async def get_all_fee_status(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["OFFICE", "ADMIN"]))
):
    return db.query(models.Fee).all()

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
    
    return {"message": "Payment recorded successfully", "receipt_id": payment.id}
