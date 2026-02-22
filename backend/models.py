from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Enum, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class UserRole(enum.Enum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    ADMIN = "ADMIN"
    OFFICE = "OFFICE"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student_profile = relationship("Student", back_populates="user", uselist=False)
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)

class Student(Base):
    __tablename__ = "students"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    department = Column(String(100))
    year = Column(Integer)
    section = Column(String(10))
    gpa = Column(Float, default=0.0)

    user = relationship("User", back_populates="student_profile")
    attendance = relationship("Attendance", back_populates="student")
    marks = relationship("Mark", back_populates="student")
    fees = relationship("Fee", back_populates="student")
    leave_requests = relationship("LeaveRequest", back_populates="student")
    feedback = relationship("Feedback", back_populates="student")

class Teacher(Base):
    __tablename__ = "teachers"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    department = Column(String(100))

    user = relationship("User", back_populates="teacher_profile")
    feedback = relationship("Feedback", back_populates="teacher")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.user_id"))
    subject_id = Column(Integer)  # Simplified for now
    date = Column(Date, default=datetime.date.today)
    hour_slot = Column(Integer) # 1 to 8
    status = Column(String(20)) # Present/Absent

    student = relationship("Student", back_populates="attendance")

class Mark(Base):
    __tablename__ = "marks"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.user_id"))
    subject_id = Column(Integer)
    semester = Column(Integer)
    internal_marks = Column(Float)
    external_marks = Column(Float)

    student = relationship("Student", back_populates="marks")

class Fee(Base):
    __tablename__ = "fees"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.user_id"))
    total_amount = Column(Float)
    paid_amount = Column(Float, default=0.0)
    due_amount = Column(Float)
    
    student = relationship("Student", back_populates="fees")
    payments = relationship("FeePayment", back_populates="fee")

class FeePayment(Base):
    __tablename__ = "fee_payments"
    id = Column(Integer, primary_key=True, index=True)
    fee_id = Column(Integer, ForeignKey("fees.id"))
    amount = Column(Float)
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    receipt_url = Column(String(255))

    fee = relationship("Fee", back_populates="payments")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.user_id"))
    reason = Column(Text)
    status = Column(String(20), default="Pending") # Pending/Approved/Rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="leave_requests")

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.user_id"))
    teacher_id = Column(Integer, ForeignKey("teachers.user_id"))
    rating = Column(Integer) # 1-5
    comment = Column(Text)

    student = relationship("Student", back_populates="feedback")
    teacher = relationship("Teacher", back_populates="feedback")
