from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class TeacherBase(BaseModel):
    first_name: str
    last_name: str
    employee_id: str
    subject_id: int
    phone_number: Optional[str] = None
    address: Optional[str] = None
    date_joined: date
    salary: Optional[float] = None

class TeacherCreate(TeacherBase):
    user_id: int

class TeacherUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    subject_id: Optional[int] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    salary: Optional[float] = None

class TeacherResponse(TeacherBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
