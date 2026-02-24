from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
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

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

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
    subject_id: int
    semester: int
    internal_marks: float
    external_marks: float

class Mark(MarkBase):
    id: int
    class Config:
        from_attributes = True

class FeeBase(BaseModel):
    student_id: int
    total_amount: float
    paid_amount: float
    due_amount: float

class Fee(FeeBase):
    id: int
    class Config:
        from_attributes = True

class LeaveRequestBase(BaseModel):
    reason: str
    start_date: date
    end_date: date

class LeaveRequest(LeaveRequestBase):
    id: int
    status: str
    created_at: datetime
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
    created_at: datetime
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
    created_at: datetime
    class Config:
        from_attributes = True

class LeaveRequestUpdate(BaseModel):
    status: str
