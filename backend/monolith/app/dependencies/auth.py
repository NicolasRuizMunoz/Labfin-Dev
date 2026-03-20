from dataclasses import dataclass
from typing import Optional

import jwt
from fastapi import HTTPException, Request, status

from app.config import SECRET_KEY, ALGORITHM
from app.database.db import SessionLocal
from app.models.user import User

_COOKIE_ACCESS = "access_token"


@dataclass
class UserTokenData:
    user_id: int
    organization_id: Optional[int]
    role: str = "client"

    @property
    def sub(self) -> str:
        return str(self.user_id)


def _decode(raw_token: str) -> UserTokenData:
    try:
        payload = jwt.decode(raw_token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    try:
        user_id = int(sub)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload (sub must be numeric)")

    # Check token not blacklisted
    from app.services.auth.token_blacklist import is_blacklisted
    if is_blacklisted(raw_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")

    return UserTokenData(
        user_id=user_id,
        organization_id=payload.get("organization_id"),
        role=payload.get("role", "client"),
    )


def _verify_active(user_id: int) -> None:
    """Check that the user still exists and is active in the database."""
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or deleted")
    finally:
        db.close()


def get_current_user(request: Request) -> UserTokenData:
    """
    Resolves the current user from:
    1. HTTP-only cookie 'access_token'  (set by /users/login — used by data.ts via credentials:include)
    2. Authorization: Bearer <token>    (sent by chat.ts from localStorage)
    Raises 401 if neither is present or valid.
    """
    token_data: UserTokenData | None = None

    # 1. Cookie (preferred — HttpOnly, not accessible from JS)
    cookie_token = request.cookies.get(_COOKIE_ACCESS)
    if cookie_token:
        token_data = _decode(cookie_token)

    # 2. Authorization header fallback
    if not token_data:
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            token_data = _decode(auth_header.split(" ", 1)[1].strip())

    if not token_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    _verify_active(token_data.user_id)
    return token_data


def require_role(*roles: str):
    """
    Dependency factory: restrict endpoint to specific roles.
    Usage: current_user: UserTokenData = Depends(require_role("evalitics"))
    """
    from fastapi import Depends

    def _check(current: UserTokenData = Depends(get_current_user)):
        if current.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current
    return _check
