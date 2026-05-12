from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date

class ManagementBase(BaseModel):
    first_name: str
    last_name: str
    employee_id: str
    position: str
    department: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    date_joined: date

class ManagementCreate(ManagementBase):
    user_id: int

class ManagementUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None

class ManagementResponse(ManagementBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
