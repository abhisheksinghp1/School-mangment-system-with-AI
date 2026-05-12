from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class AILog(Base):
    __tablename__ = "ai_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # ID of the user who made the request
    user_role = Column(String(20), nullable=False)  # STUDENT, TEACHER, PARENT, MANAGEMENT
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    tools_used = Column(Text)  # JSON string of tools used
    execution_time_ms = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
