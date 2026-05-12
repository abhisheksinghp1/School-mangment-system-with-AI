from fastapi import HTTPException, status, Depends
from app.auth.jwt_handler import get_current_user
from app.models.user import User, UserRole


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure the authenticated user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_role(*roles: str):
    """
    Dependency factory — accepts one or more role strings.
    Usage:
        Depends(require_role("MANAGEMENT"))
        Depends(require_role("TEACHER", "MANAGEMENT"))
    """
    def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted. Required role(s): {', '.join(roles)}"
            )
        return current_user
    return role_checker


# Convenience aliases kept for backward compatibility
def get_current_user_role(required_role: str):
    return require_role(required_role)
