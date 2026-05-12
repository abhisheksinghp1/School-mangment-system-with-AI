from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class AttendanceBase(BaseModel):
    student_id: int
    teacher_id: int
    date: date
    status: str  # PRESENT, ABSENT, LATE
    remarks: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
