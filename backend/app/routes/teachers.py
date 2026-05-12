from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.teacher import Teacher
from app.schemas.teacher import TeacherCreate, TeacherResponse, TeacherUpdate
from app.auth.dependencies import get_current_active_user, require_role

router = APIRouter()


@router.post("/", response_model=TeacherResponse)
async def create_teacher(
    teacher: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGEMENT"))
):
    user = db.query(User).filter(User.id == teacher.user_id).first()
    if not user or user.role != UserRole.TEACHER:
        raise HTTPException(status_code=400, detail="Invalid user ID or user role")

    if db.query(Teacher).filter(Teacher.employee_id == teacher.employee_id).first():
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    db_teacher = Teacher(**teacher.dict())
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher


@router.get("/", response_model=List[TeacherResponse])
async def get_teachers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGEMENT"))
):
    return db.query(Teacher).offset(skip).limit(limit).all()


@router.get("/me", response_model=TeacherResponse)
async def get_my_teacher_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("TEACHER"))
):
    """Teacher fetches their own profile."""
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return teacher


@router.get("/{teacher_id}", response_model=TeacherResponse)
async def get_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role == UserRole.TEACHER:
        teacher = db.query(Teacher).filter(
            Teacher.user_id == current_user.id,
            Teacher.id == teacher_id
        ).first()
    else:
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()

    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


@router.put("/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(
    teacher_id: int,
    teacher_update: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGEMENT"))
):
    db_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    for field, value in teacher_update.dict(exclude_unset=True).items():
        setattr(db_teacher, field, value)

    db.commit()
    db.refresh(db_teacher)
    return db_teacher


@router.delete("/{teacher_id}")
async def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGEMENT"))
):
    db_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    db.delete(db_teacher)
    db.commit()
    return {"message": "Teacher deleted successfully"}
