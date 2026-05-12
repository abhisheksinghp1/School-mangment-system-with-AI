from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: int
    class_id: int
    exam_date: date
    total_marks: int
    duration_minutes: int
    exam_type: str  # MIDTERM, FINAL, QUIZ, ASSIGNMENT

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    exam_date: Optional[date] = None
    total_marks: Optional[int] = None
    duration_minutes: Optional[int] = None
    exam_type: Optional[str] = None

class ExamResponse(ExamBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
