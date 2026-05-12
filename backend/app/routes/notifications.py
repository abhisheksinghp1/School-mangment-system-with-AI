from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.parent import Parent
from app.models.management import Management
from app.schemas.notification import NotificationCreate, NotificationResponse
from app.auth.dependencies import get_current_active_user, require_role

router = APIRouter()


def _get_profile_id(db: Session, user: User) -> Optional[int]:
    """Return the role-specific profile ID for the given user."""
    if user.role == UserRole.STUDENT:
        p = db.query(Student).filter(Student.user_id == user.id).first()
    elif user.role == UserRole.TEACHER:
        p = db.query(Teacher).filter(Teacher.user_id == user.id).first()
    elif user.role == UserRole.PARENT:
        p = db.query(Parent).filter(Parent.user_id == user.id).first()
    else:
        p = db.query(Management).filter(Management.user_id == user.id).first()
    return p.id if p else None


@router.post("/", response_model=NotificationResponse)
async def send_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("TEACHER", "MANAGEMENT"))
):
    sender_id = _get_profile_id(db, current_user)
    if not sender_id:
        raise HTTPException(status_code=400, detail="Sender profile not found")

    db_notification = Notification(
        **notification.dict(),
        sender_id=sender_id,
        sender_type=current_user.role.value
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile_id = _get_profile_id(db, current_user)
    if not profile_id:
        return []

    query = db.query(Notification).filter(
        Notification.recipient_id == profile_id,
        Notification.recipient_type == current_user.role.value
    )

    if unread_only:
        query = query.filter(Notification.is_read == False)

    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile_id = _get_profile_id(db, current_user)
    if not profile_id:
        return {"count": 0}

    count = db.query(Notification).filter(
        Notification.recipient_id == profile_id,
        Notification.recipient_type == current_user.role.value,
        Notification.is_read == False
    ).count()
    return {"count": count}


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    profile_id = _get_profile_id(db, current_user)
    if notification.recipient_id != profile_id or notification.recipient_type != current_user.role.value:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile_id = _get_profile_id(db, current_user)
    if not profile_id:
        return {"message": "No notifications"}

    db.query(Notification).filter(
        Notification.recipient_id == profile_id,
        Notification.recipient_type == current_user.role.value,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    profile_id = _get_profile_id(db, current_user)
    if notification.recipient_id != profile_id or notification.recipient_type != current_user.role.value:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted successfully"}
