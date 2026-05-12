from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentResponse, StudentUpdate
from app.auth.dependencies import get_current_active_user, require_role

router = APIRouter()


@router.post("/", response_model=StudentResponse)
async def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGEMENT"))
):
    user = db.query(User).filter(User.id == student.user_id).first()
    if not user or user.role != UserRole.STUDENT:
        raise HTTPException(status_code=400, detail="Invalid user ID or user role")

    if db.query(Student).filter(Student.admission_number == student.admission_number).first():
        raise HTTPException(status_code=400, detail="Admission number already exists")

    db_student = Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


@router.get("/", response_model=List[StudentResponse])
async def get_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGEMENT", "TEACHER"))
):
    return db.query(Student).offset(skip).limit(limit).all()


@router.get("/me", response_model=StudentResponse)
async def get_my_student_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("STUDENT"))
):
    """Student fetches their own profile."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(
            Student.user_id == current_user.id,
            Student.id == student_id
        ).first()
    else:
        student = db.query(Student).filter(Student.id == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_update: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGEMENT"))
):
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    for field, value in student_update.dict(exclude_unset=True).items():
        setattr(db_student, field, value)

    db.commit()
    db.refresh(db_student)
    return db_student


@router.delete("/{student_id}")
async def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGEMENT"))
):
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(db_student)
    db.commit()
    return {"message": "Student deleted successfully"}
