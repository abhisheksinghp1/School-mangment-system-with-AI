from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.salary import Salary
from app.schemas.salary import SalaryCreate, SalaryResponse, SalaryUpdate
from app.auth.dependencies import require_role

router = APIRouter()


@router.post("/", response_model=SalaryResponse)
async def create_salary(
    salary: SalaryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("MANAGEMENT"))
):
    db_salary = Salary(**salary.dict())
    db.add(db_salary)
    db.commit()
    db.refresh(db_salary)
    return db_salary


@router.get("/", response_model=List[SalaryResponse])
async def get_salaries(
    skip: int = 0,
    limit: int = 100,
    teacher_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("MANAGEMENT"))
):
    query = db.query(Salary)
    if teacher_id:
        query = query.filter(Salary.teacher_id == teacher_id)
    if status:
        query = query.filter(Salary.status == status)
    return query.order_by(Salary.year.desc(), Salary.month.desc()).offset(skip).limit(limit).all()


@router.get("/{salary_id}", response_model=SalaryResponse)
async def get_salary(
    salary_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("MANAGEMENT"))
):
    salary = db.query(Salary).filter(Salary.id == salary_id).first()
    if not salary:
        raise HTTPException(status_code=404, detail="Salary record not found")
    return salary


@router.put("/{salary_id}", response_model=SalaryResponse)
async def update_salary(
    salary_id: int,
    salary_update: SalaryUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("MANAGEMENT"))
):
    db_salary = db.query(Salary).filter(Salary.id == salary_id).first()
    if not db_salary:
        raise HTTPException(status_code=404, detail="Salary record not found")

    for field, value in salary_update.dict(exclude_unset=True).items():
        setattr(db_salary, field, value)

    db.commit()
    db.refresh(db_salary)
    return db_salary


@router.delete("/{salary_id}")
async def delete_salary(
    salary_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("MANAGEMENT"))
):
    db_salary = db.query(Salary).filter(Salary.id == salary_id).first()
    if not db_salary:
        raise HTTPException(status_code=404, detail="Salary record not found")

    db.delete(db_salary)
    db.commit()
    return {"message": "Salary record deleted"}
