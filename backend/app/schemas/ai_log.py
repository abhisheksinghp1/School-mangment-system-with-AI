from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AILogBase(BaseModel):
    user_id: int
    user_role: str  # STUDENT, TEACHER, PARENT, MANAGEMENT
    query: str
    response: str
    tools_used: Optional[str] = None
    execution_time_ms: Optional[int] = None

class AILogCreate(AILogBase):
    pass

class AILogResponse(AILogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
