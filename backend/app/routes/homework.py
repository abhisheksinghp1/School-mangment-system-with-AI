from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User, UserRole
from app.models.homework import Homework
from app.models.student import Student
from app.models.teacher import Teacher
from app.schemas.homework import HomeworkCreate, HomeworkResponse, HomeworkUpdate
from app.auth.dependencies import get_current_active_user, require_role

router = APIRouter()


@router.post("/", response_model=HomeworkResponse)
async def assign_homework(
    homework: HomeworkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("TEACHER", "MANAGEMENT"))
):
    db_homework = Homework(**homework.dict())
    db.add(db_homework)
    db.commit()
    db.refresh(db_homework)
    return db_homework


@router.get("/", response_model=List[HomeworkResponse])
async def get_homework(
    skip: int = 0,
    limit: int = 100,
    class_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Homework)

    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            query = query.filter(Homework.class_id == student.class_id)
    elif current_user.role == UserRole.TEACHER:
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if teacher:
            query = query.filter(Homework.teacher_id == teacher.id)
        if class_id:
            query = query.filter(Homework.class_id == class_id)
        if subject_id:
            query = query.filter(Homework.subject_id == subject_id)
    elif current_user.role == UserRole.PARENT:
        if student_id:
            student = db.query(Student).filter(Student.id == student_id).first()
            if student:
                query = query.filter(Homework.class_id == student.class_id)
    else:  # MANAGEMENT
        if class_id:
            query = query.filter(Homework.class_id == class_id)
        if subject_id:
            query = query.filter(Homework.subject_id == subject_id)

    return query.order_by(Homework.assigned_date.desc()).offset(skip).limit(limit).all()


@router.get("/{homework_id}", response_model=HomeworkResponse)
async def get_homework_details(
    homework_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or homework.class_id != student.class_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    return homework


@router.put("/{homework_id}", response_model=HomeworkResponse)
async def update_homework(
    homework_id: int,
    homework_update: HomeworkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("TEACHER", "MANAGEMENT"))
):
    db_homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not db_homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    for field, value in homework_update.dict(exclude_unset=True).items():
        setattr(db_homework, field, value)

    db.commit()
    db.refresh(db_homework)
    return db_homework


@router.delete("/{homework_id}")
async def delete_homework(
    homework_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("TEACHER", "MANAGEMENT"))
):
    db_homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not db_homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    db.delete(db_homework)
    db.commit()
    return {"message": "Homework deleted successfully"}
