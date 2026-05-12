from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    recipient_id: int
    recipient_type: str  # STUDENT, TEACHER, PARENT, MANAGEMENT
    sender_id: int
    sender_type: str  # STUDENT, TEACHER, PARENT, MANAGEMENT
    priority: str = "NORMAL"  # LOW, NORMAL, HIGH, URGENT

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    is_read: Optional[bool] = None
    priority: Optional[str] = None

class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
