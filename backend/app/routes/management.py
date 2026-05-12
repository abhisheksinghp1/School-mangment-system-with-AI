from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.management import Management
from app.schemas.management import ManagementCreate, ManagementResponse, ManagementUpdate
from app.auth.dependencies import get_current_user_role

router = APIRouter()

@router.post("/", response_model=ManagementResponse)
async def create_management(
    management: ManagementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_role("MANAGEMENT"))
):
    # Verify user exists
    user = db.query(User).filter(User.id == management.user_id).first()
    if not user or user.role != UserRole.MANAGEMENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID or user role"
        )
    
    # Check if employee ID already exists
    existing_management = db.query(Management).filter(Management.employee_id == management.employee_id).first()
    if existing_management:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID already exists"
        )
    
    db_management = Management(**management.dict())
    db.add(db_management)
    db.commit()
    db.refresh(db_management)
    return db_management

@router.get("/", response_model=List[ManagementResponse])
async def get_management_staff(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_role("MANAGEMENT"))
):
    management = db.query(Management).offset(skip).limit(limit).all()
    return management

@router.get("/{management_id}", response_model=ManagementResponse)
async def get_management_staff_member(
    management_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_role("MANAGEMENT"))
):
    management = db.query(Management).filter(Management.id == management_id).first()
    if not management:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Management staff member not found"
        )
    return management

@router.put("/{management_id}", response_model=ManagementResponse)
async def update_management(
    management_id: int,
    management_update: ManagementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_role("MANAGEMENT"))
):
    db_management = db.query(Management).filter(Management.id == management_id).first()
    if not db_management:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Management staff member not found"
        )
    
    for field, value in management_update.dict(exclude_unset=True).items():
        setattr(db_management, field, value)
    
    db.commit()
    db.refresh(db_management)
    return db_management

@router.delete("/{management_id}")
async def delete_management(
    management_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_role("MANAGEMENT"))
):
    db_management = db.query(Management).filter(Management.id == management_id).first()
    if not db_management:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Management staff member not found"
        )
    
    db.delete(db_management)
    db.commit()
    return {"message": "Management staff member deleted successfully"}
