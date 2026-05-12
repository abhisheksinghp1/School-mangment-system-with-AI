from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    grade = Column(Integer, nullable=False)
    section = Column(String(10))
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    max_students = Column(Integer, default=40)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    class_teacher = relationship("Teacher", back_populates="assigned_class")
    students = relationship("Student", back_populates="class_info")
