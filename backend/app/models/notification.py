from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    recipient_id = Column(Integer, nullable=False)  # Can be student, teacher, parent, or management ID
    recipient_type = Column(String(20), nullable=False)  # STUDENT, TEACHER, PARENT, MANAGEMENT
    sender_id = Column(Integer, nullable=False)  # ID of the sender
    sender_type = Column(String(20), nullable=False)  # STUDENT, TEACHER, PARENT, MANAGEMENT
    is_read = Column(Boolean, default=False)
    priority = Column(String(20), default="NORMAL")  # LOW, NORMAL, HIGH, URGENT
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
