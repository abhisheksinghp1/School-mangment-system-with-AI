from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class HomeworkBase(BaseModel):
    teacher_id: int
    class_id: int
    subject_id: int
    title: str
    description: str
    due_date: date
    assigned_date: date
    max_marks: int = 100

class HomeworkCreate(HomeworkBase):
    pass

class HomeworkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    max_marks: Optional[int] = None

class HomeworkResponse(HomeworkBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
