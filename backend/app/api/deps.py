"""
deps.py — Shared FastAPI dependencies for DB access and JWT-based auth.

get_current_user resolves the bearer token to a User row; require_role()
builds a dependency that additionally checks the user's role, for gating
Organizer/Admin-only routes.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise credentials_exception

    token = credentials.credentials

    payload = decode_access_token(token)

    if payload is None or "sub" not in payload:
        raise credentials_exception

    user = db.get(User, int(payload["sub"]))

    if user is None:
        raise credentials_exception

    return user


def require_role(*allowed: UserRole):
    def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role in {[r.value for r in allowed]}",
            )
        return user

    return _check