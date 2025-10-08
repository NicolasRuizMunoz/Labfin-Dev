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

def get_current_user_data(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> UserTokenData:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    sub = payload.get("sub") or {}
    uid = sub.get("uid")
    if not uid:
        raise HTTPException(401, "Invalid token")
    user = db.get(User, uid)
    if not user or not user.is_active:
        raise HTTPException(401, "User disabled")
    return UserTokenData(user_id=user.id, organization_id=user.organization_id, role_id=user.role_id)
