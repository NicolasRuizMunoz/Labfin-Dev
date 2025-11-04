# auth_service/dependencies/auth.py
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.security import decode_token
from app.database.db import get_db
from app.models.user import User

class UserTokenData:
    def __init__(self, user_id: int, organization_id: int | None, role_id: int):
        self.user_id = user_id
        self.organization_id = organization_id
        self.role_id = role_id

def get_current_user_data(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
) -> UserTokenData:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = authorization.split(" ", 1)[1]

    payload = decode_token(token)

    # sub ahora es string (user id)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token (missing sub)")
    try:
        uid = int(sub)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token (sub must be numeric string)")

    user = db.get(User, uid)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User disabled")

    # claims hermanos
    org_id = payload.get("organization_id")
    role_id = payload.get("role_id")

    return UserTokenData(user_id=user.id, organization_id=org_id, role_id=role_id)
