from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Enum, Boolean, Text, Numeric
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class UserRole(enum.Enum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    ADMIN = "ADMIN"
    ADMISSION = "ADMISSION"
    EXAM = "EXAM"
    ACCOUNT = "ACCOUNT"

class AdmissionRequest(Base):
    __tablename__ = "admission_requests"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50))
    last_name = Column(String(50))
    email = Column(String(100), unique=True, index=True)
    phone_number = Column(String(20))
    desired_course = Column(String(100))
    previous_gpa = Column(Float)
    status = Column(String(20), default="Pending", index=True) # Pending, Approved, Rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False, cascade="all, delete-orphan")
    admission_profile = relationship("AdmissionStaff", back_populates="user", uselist=False, cascade="all, delete-orphan")
    exam_profile = relationship("ExamStaff", back_populates="user", uselist=False, cascade="all, delete-orphan")
    account_profile = relationship("AccountStaff", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Student(Base):
    __tablename__ = "students"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    roll_number = Column(String(50), unique=True, index=True)
    department = Column(String(100))
    year = Column(Integer)
    section = Column(String(10))
    phone_number = Column(String(20))
    address = Column(Text)
    gpa = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="student_profile")
    attendance = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")
    fees = relationship("Fee", back_populates="student", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="student", cascade="all, delete-orphan")
    grievances = relationship("Grievance", back_populates="student", cascade="all, delete-orphan")

class Teacher(Base):
    __tablename__ = "teachers"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    department = Column(String(100))
    phone_number = Column(String(20))
    address = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="teacher_profile")
    feedback = relationship("Feedback", back_populates="teacher", cascade="all, delete-orphan")

class AdmissionStaff(Base):
    __tablename__ = "admission_staff"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    access_level = Column(String(50), default="Standard")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    user = relationship("User", back_populates="admission_profile")

class ExamStaff(Base):
    __tablename__ = "exam_staff"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    examination_zone = Column(String(50), default="Main Campus")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    user = relationship("User", back_populates="exam_profile")

class AccountStaff(Base):
    __tablename__ = "account_staff"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    ledger_access = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    user = relationship("User", back_populates="account_profile")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.user_id"), index=True)
    subject_id = Column(Integer, index=True)  # Simplified for now
    date = Column(Date, default=datetime.date.today, index=True)
    hour_slot = Column(Integer) # 1 to 8
    status = Column(String(20)) # Present/Absent
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="attendance")

class Mark(Base):
    __tablename__ = "marks"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.user_id"), index=True)
    academic_year = Column(String(20), index=True)
    semester = Column(Integer, index=True)
    subject_code = Column(String(20), index=True)
    subject_name = Column(String(100))
    exam_type = Column(String(50), index=True) # Mid-1, Mid-2, Internal, External, End Semester, etc.
    department = Column(String(100), index=True)
    section = Column(String(10), index=True)
    internal_marks = Column(Float, default=0.0)
    external_marks = Column(Float, default=0.0)
    status = Column(String(20), default="Pending") # Pending, Approved, Published
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="marks")

class Fee(Base):
    __tablename__ = "fees"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.user_id"), unique=True, index=True)
    total_amount = Column(Numeric(12, 2))
    paid_amount = Column(Numeric(12, 2), default=0.0)
    due_amount = Column(Numeric(12, 2))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    student = relationship("Student", back_populates="fees")
    payments = relationship("FeePayment", back_populates="fee", cascade="all, delete-orphan")

class FeePayment(Base):
    __tablename__ = "fee_payments"
    id = Column(Integer, primary_key=True, index=True)
    fee_id = Column(Integer, ForeignKey("fees.id"), index=True)
    amount = Column(Numeric(12, 2))
    payment_date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    receipt_url = Column(String(255))

    fee = relationship("Fee", back_populates="payments")


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.user_id"))
    teacher_id = Column(Integer, ForeignKey("teachers.user_id"))
    rating = Column(Integer) # 1-5
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="feedback")
    teacher = relationship("Teacher", back_populates="feedback")

class Grievance(Base):
    __tablename__ = "grievances"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.user_id"), index=True)
    title = Column(String(200))
    description = Column(Text)
    category = Column(String(50), index=True) # Academic, Administrative, Infrastructure, Harassment, Other
    status = Column(String(20), default="Pending", index=True) # Pending, In Progress, Resolved, Closed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="grievances")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.user_id"))
    title = Column(String(200))
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="notifications")

class SystemConfig(Base):
    __tablename__ = "system_config"
    id = Column(Integer, primary_key=True, index=True)
    mark_entry_enabled = Column(Boolean, default=False)
    results_published = Column(Boolean, default=False)

class QuestionPaper(Base):
    __tablename__ = "question_papers"
    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(20), index=True)
    subject_name = Column(String(100))
    faculty_name = Column(String(100))
    semester = Column(Integer, index=True)
    questions_data = Column(Text)  # JSON String of questions by category
    file_url = Column(String(255))
    exam_type = Column(String(50), default="Regular")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

# Update Student relationship
Student.notifications = relationship("Notification", back_populates="student", cascade="all, delete-orphan")
