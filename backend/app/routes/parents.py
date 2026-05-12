from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.parent import Parent
from app.schemas.parent import ParentCreate, ParentResponse, ParentUpdate
from app.auth.dependencies import get_current_active_user, require_role

router = APIRouter()


@router.post("/", response_model=ParentResponse)
async def create_parent(
    parent: ParentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGEMENT"))
):
    user = db.query(User).filter(User.id == parent.user_id).first()
    if not user or user.role != UserRole.PARENT:
        raise HTTPException(status_code=400, detail="Invalid user ID or user role")

    db_parent = Parent(**parent.dict())
    db.add(db_parent)
    db.commit()
    db.refresh(db_parent)
    return db_parent


@router.get("/", response_model=List[ParentResponse])
async def get_parents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGEMENT"))
):
    return db.query(Parent).offset(skip).limit(limit).all()


@router.get("/me", response_model=ParentResponse)
async def get_my_parent_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("PARENT"))
):
    """Parent fetches their own profile including children."""
    parent = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    return parent


@router.get("/{parent_id}", response_model=ParentResponse)
async def get_parent(
    parent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role == UserRole.PARENT:
        parent = db.query(Parent).filter(
            Parent.user_id == current_user.id,
            Parent.id == parent_id
        ).first()
    else:
        parent = db.query(Parent).filter(Parent.id == parent_id).first()

    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent


@router.put("/{parent_id}", response_model=ParentResponse)
async def update_parent(
    parent_id: int,
    parent_update: ParentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGEMENT"))
):
    db_parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not db_parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    for field, value in parent_update.dict(exclude_unset=True).items():
        setattr(db_parent, field, value)

    db.commit()
    db.refresh(db_parent)
    return db_parent


@router.delete("/{parent_id}")
async def delete_parent(
    parent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGEMENT"))
):
    db_parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not db_parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    db.delete(db_parent)
    db.commit()
    return {"message": "Parent deleted successfully"}
