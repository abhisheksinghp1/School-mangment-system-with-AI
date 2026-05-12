from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    admission_number: str
    class_id: int
    parent_id: int
    address: Optional[str] = None
    phone_number: Optional[str] = None

class StudentCreate(StudentBase):
    user_id: int

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    class_id: Optional[int] = None
    parent_id: Optional[int] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None

class StudentResponse(StudentBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
