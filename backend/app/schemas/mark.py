from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MarkBase(BaseModel):
    student_id: int
    exam_id: int
    subject_id: int
    marks_obtained: float
    max_marks: float
    grade: Optional[str] = None
    remarks: Optional[str] = None

class MarkCreate(MarkBase):
    pass

class MarkUpdate(BaseModel):
    marks_obtained: Optional[float] = None
    max_marks: Optional[float] = None
    grade: Optional[str] = None
    remarks: Optional[str] = None

class MarkResponse(MarkBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
