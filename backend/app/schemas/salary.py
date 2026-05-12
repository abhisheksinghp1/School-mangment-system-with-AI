from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class SalaryBase(BaseModel):
    teacher_id: int
    amount: float
    month: int  # 1-12
    year: int
    payment_date: Optional[date] = None
    status: str = "PENDING"  # PENDING, PAID, CANCELLED
    deductions: float = 0
    bonuses: float = 0
    remarks: Optional[str] = None

class SalaryCreate(SalaryBase):
    pass

class SalaryUpdate(BaseModel):
    amount: Optional[float] = None
    payment_date: Optional[date] = None
    status: Optional[str] = None
    deductions: Optional[float] = None
    bonuses: Optional[float] = None
    remarks: Optional[str] = None

class SalaryResponse(SalaryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
