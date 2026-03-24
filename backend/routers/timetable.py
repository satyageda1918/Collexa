from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, database, dependencies
from websocket_manager import manager

router = APIRouter()

@router.get("/subjects", response_model=List[schemas.Subject])
async def get_subjects(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    return db.query(models.Subject).all()

@router.post("/subjects", response_model=schemas.Subject)
async def create_subject(
    subject: schemas.SubjectCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMIN"]))
):
    db_subject = models.Subject(**subject.dict())
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.get("/entries", response_model=List[schemas.TimetableEntry])
async def get_timetable_entries(
    department: Optional[str] = None,
    year: Optional[int] = None,
    section: Optional[str] = None,
    semester: Optional[int] = None,
    teacher_id: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    query = db.query(models.TimetableEntry)
    if department: query = query.filter(models.TimetableEntry.department == department)
    if year: query = query.filter(models.TimetableEntry.year == year)
    if section: query = query.filter(models.TimetableEntry.section == section)
    if semester: query = query.filter(models.TimetableEntry.semester == semester)
    if teacher_id: query = query.filter(models.TimetableEntry.teacher_id == teacher_id)
    return query.all()

@router.post("/entries", response_model=schemas.TimetableEntry)
async def create_timetable_entry(
    entry: schemas.TimetableEntryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMIN"]))
):
    # Conflict Check 1: Teacher Conflict
    teacher_conflict = db.query(models.TimetableEntry).filter(
        models.TimetableEntry.teacher_id == entry.teacher_id,
        models.TimetableEntry.day_of_week == entry.day_of_week,
        models.TimetableEntry.hour_slot == entry.hour_slot,
        models.TimetableEntry.semester == entry.semester
    ).first()
    if teacher_conflict:
        teacher_name = db.query(models.User).filter(models.User.id == entry.teacher_id).first().name
        raise HTTPException(
            status_code=400,
            detail=f"Conflict: Professor {teacher_name} is already assigned to {teacher_conflict.department} {teacher_conflict.year}-{teacher_conflict.section} at this time."
        )

    # Conflict Check 2: Section Conflict
    section_conflict = db.query(models.TimetableEntry).filter(
        models.TimetableEntry.department == entry.department,
        models.TimetableEntry.year == entry.year,
        models.TimetableEntry.section == entry.section,
        models.TimetableEntry.day_of_week == entry.day_of_week,
        models.TimetableEntry.hour_slot == entry.hour_slot,
        models.TimetableEntry.semester == entry.semester
    ).first()
    if section_conflict:
        raise HTTPException(
            status_code=400,
            detail=f"Conflict: This section already has a class ({section_conflict.subject.name}) scheduled in this slot."
        )

    db_entry = models.TimetableEntry(**entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    # Notify updates via WebSocket
    await manager.broadcast("TIMETABLE_UPDATED")
    
    return db_entry

@router.delete("/entries/{entry_id}")
async def delete_timetable_entry(
    entry_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.RoleChecker(["ADMIN"]))
):
    db_entry = db.query(models.TimetableEntry).filter(models.TimetableEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(db_entry)
    db.commit()
    await manager.broadcast("TIMETABLE_UPDATED")
    return {"message": "Entry deleted"}

@router.get("/my-timetable", response_model=List[schemas.TimetableEntry])
async def get_my_timetable(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    if current_user.role == models.UserRole.STUDENT:
        student = current_user.student_profile
        return db.query(models.TimetableEntry).filter(
            models.TimetableEntry.department == student.department,
            models.TimetableEntry.year == student.year,
            models.TimetableEntry.section == student.section
        ).all()
    elif current_user.role == models.UserRole.TEACHER:
        return db.query(models.TimetableEntry).filter(
            models.TimetableEntry.teacher_id == current_user.id
        ).all()
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
