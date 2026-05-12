from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User, UserRole
from app.models.mark import Mark
from app.models.student import Student
from app.schemas.mark import MarkCreate, MarkResponse, MarkUpdate
from app.auth.dependencies import get_current_active_user, require_role

router = APIRouter()


def _calculate_grade(percentage: float) -> str:
    if percentage >= 90: return "A+"
    if percentage >= 80: return "A"
    if percentage >= 70: return "B+"
    if percentage >= 60: return "B"
    if percentage >= 50: return "C"
    if percentage >= 40: return "D"
    return "F"


@router.post("/", response_model=MarkResponse)
async def upload_marks(
    mark: MarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("TEACHER", "MANAGEMENT"))
):
    if not db.query(Student).filter(Student.id == mark.student_id).first():
        raise HTTPException(status_code=404, detail="Student not found")

    if db.query(Mark).filter(
        Mark.student_id == mark.student_id,
        Mark.exam_id == mark.exam_id,
        Mark.subject_id == mark.subject_id
    ).first():
        raise HTTPException(status_code=400, detail="Marks already exist for this student in this exam")

    mark_data = mark.dict()
    mark_data["grade"] = _calculate_grade((mark.marks_obtained / mark.max_marks) * 100)

    db_mark = Mark(**mark_data)
    db.add(db_mark)
    db.commit()
    db.refresh(db_mark)
    return db_mark


@router.get("/", response_model=List[MarkResponse])
async def get_marks(
    skip: int = 0,
    limit: int = 100,
    student_id: Optional[int] = None,
    exam_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Mark)

    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            query = query.filter(Mark.student_id == student.id)
    elif current_user.role in (UserRole.TEACHER, UserRole.PARENT, UserRole.MANAGEMENT):
        if student_id:
            query = query.filter(Mark.student_id == student_id)

    if exam_id:
        query = query.filter(Mark.exam_id == exam_id)
    if subject_id:
        query = query.filter(Mark.subject_id == subject_id)

    return query.offset(skip).limit(limit).all()


@router.get("/{mark_id}", response_model=MarkResponse)
async def get_mark_details(
    mark_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    mark = db.query(Mark).filter(Mark.id == mark_id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark record not found")

    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or mark.student_id != student.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    return mark


@router.put("/{mark_id}", response_model=MarkResponse)
async def update_mark(
    mark_id: int,
    mark_update: MarkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("TEACHER", "MANAGEMENT"))
):
    db_mark = db.query(Mark).filter(Mark.id == mark_id).first()
    if not db_mark:
        raise HTTPException(status_code=404, detail="Mark record not found")

    for field, value in mark_update.dict(exclude_unset=True).items():
        setattr(db_mark, field, value)

    # Recalculate grade
    db_mark.grade = _calculate_grade((db_mark.marks_obtained / db_mark.max_marks) * 100)

    db.commit()
    db.refresh(db_mark)
    return db_mark


@router.delete("/{mark_id}")
async def delete_mark(
    mark_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("TEACHER", "MANAGEMENT"))
):
    db_mark = db.query(Mark).filter(Mark.id == mark_id).first()
    if not db_mark:
        raise HTTPException(status_code=404, detail="Mark record not found")

    db.delete(db_mark)
    db.commit()
    return {"message": "Mark record deleted successfully"}
