from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    employee_id = Column(String(20), unique=True, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    phone_number = Column(String(20))
    address = Column(String(200))
    date_joined = Column(Date, nullable=False)
    salary = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="teacher")
    subject = relationship("Subject", back_populates="teachers")
    attendance_records = relationship("Attendance", back_populates="teacher")
    homework_assigned = relationship("Homework", back_populates="teacher")
    salary_records = relationship("Salary", back_populates="teacher")
    assigned_class = relationship("Class", back_populates="class_teacher")
