from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ParentBase(BaseModel):
    first_name: str
    last_name: str
    phone_number: str
    email: EmailStr
    occupation: Optional[str] = None
    address: Optional[str] = None

class ParentCreate(ParentBase):
    user_id: int

class ParentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    occupation: Optional[str] = None
    address: Optional[str] = None

class ParentResponse(ParentBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
