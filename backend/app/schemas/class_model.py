from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ClassBase(BaseModel):
    name: str
    grade: int
    section: Optional[str] = None
    teacher_id: Optional[int] = None
    max_students: int = 40

class ClassCreate(ClassBase):
    pass

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    grade: Optional[int] = None
    section: Optional[str] = None
    teacher_id: Optional[int] = None
    max_students: Optional[int] = None

class ClassResponse(ClassBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
