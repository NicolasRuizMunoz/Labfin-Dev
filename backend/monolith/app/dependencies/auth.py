from dataclasses import dataclass
from typing import Optional

import jwt
from fastapi import Cookie, Header, HTTPException, Request, status

from app.config import SECRET_KEY, ALGORITHM

_COOKIE_ACCESS = "access_token"


@dataclass
class UserTokenData:
    user_id: int
    organization_id: Optional[int]

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

    return UserTokenData(user_id=user_id, organization_id=payload.get("organization_id"))


def get_current_user(request: Request) -> UserTokenData:
    """
    Resolves the current user from:
    1. HTTP-only cookie 'access_token'  (set by /users/login — used by data.ts via credentials:include)
    2. Authorization: Bearer <token>    (sent by chat.ts from localStorage)
    Raises 401 if neither is present or valid.
    """
    # 1. Cookie (preferred — HttpOnly, not accessible from JS)
    cookie_token = request.cookies.get(_COOKIE_ACCESS)
    if cookie_token:
        return _decode(cookie_token)

    # 2. Authorization header fallback
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        return _decode(auth_header.split(" ", 1)[1].strip())

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
