from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from models import UserRole

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserCreateExtended(UserCreate):
    department: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

class User(UserBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    id: Optional[int] = None

class StudentBase(BaseModel):
    department: str
    year: int
    section: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    gpa: float = 0.0

class Student(StudentBase):
    user_id: int
    class Config:
        from_attributes = True

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

class StudentWithAttendance(User):
    attendance_percentage: float = 0.0

class TeacherBase(BaseModel):
    department: str
    phone_number: Optional[str] = None
    address: Optional[str] = None

class Teacher(TeacherBase):
    user_id: int
    class Config:
        from_attributes = True

class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

class AdmissionStaffBase(BaseModel):
    access_level: str = "Standard"

class AdmissionStaff(AdmissionStaffBase):
    user_id: int
    class Config:
        from_attributes = True

class ExamStaffBase(BaseModel):
    examination_zone: str = "Main Campus"

class ExamStaff(ExamStaffBase):
    user_id: int
    class Config:
        from_attributes = True

class AccountStaffBase(BaseModel):
    ledger_access: bool = True

class AccountStaff(AccountStaffBase):
    user_id: int
    class Config:
        from_attributes = True

class UserDetailed(User):
    student_profile: Optional[Student] = None
    teacher_profile: Optional[Teacher] = None
    admission_profile: Optional[AdmissionStaff] = None
    exam_profile: Optional[ExamStaff] = None
    account_profile: Optional[AccountStaff] = None
    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    student_id: int
    subject_id: int
    date: date
    hour_slot: int
    status: str

class Attendance(AttendanceBase):
    id: int
    class Config:
        from_attributes = True

class MarkBase(BaseModel):
    student_id: int
    academic_year: str
    semester: int
    subject_code: str
    subject_name: str
    exam_type: str
    department: str
    section: str
    internal_marks: float = 0.0
    external_marks: float = 0.0
    status: str = "Pending"

class Mark(MarkBase):
    id: int
    class Config:
        from_attributes = True

class MarkCreate(BaseModel):
    student_id: int
    academic_year: str
    semester: int
    subject_code: str
    subject_name: str
    exam_type: str
    department: str
    section: str
    internal_marks: float
    external_marks: float

class FeeBase(BaseModel):
    student_id: int
    total_amount: Decimal
    paid_amount: Decimal
    due_amount: Decimal

class Fee(FeeBase):
    id: int
    class Config:
        from_attributes = True

class FeePaymentBase(BaseModel):
    fee_id: int
    amount: Decimal
    payment_date: Optional[datetime] = None

class FeePayment(FeePaymentBase):
    id: int
    class Config:
        from_attributes = True


class FeedbackBase(BaseModel):
    teacher_id: int
    rating: int
    comment: str

class Feedback(FeedbackBase):
    id: int
    student_id: int
    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    title: str
    message: str

class Notification(NotificationBase):
    id: int
    is_read: bool
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class AdmissionRequestBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str
    desired_course: str
    previous_gpa: float

class AdmissionRequestCreate(AdmissionRequestBase):
    pass

class AdmissionRequest(AdmissionRequestBase):
    id: int
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class SystemConfig(BaseModel):
    mark_entry_enabled: bool
    results_published: bool
    class Config:
        from_attributes = True

class QuestionEntry(BaseModel):
    category: str  # 2-mark, 5-mark, etc
    question: str

class QuestionPaperBase(BaseModel):
    subject_code: str
    subject_name: str
    faculty_name: str
    semester: int
    questions_data: str  # Stringified JSON for now
    file_url: Optional[str] = None
    exam_type: str = "Regular"

class QuestionPaperCreate(QuestionPaperBase):
    pass

class QuestionPaper(QuestionPaperBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class MarkUpdate(BaseModel):
    internal_marks: Optional[float] = None
    external_marks: Optional[float] = None
    status: Optional[str] = None
