from datetime import datetime, timedelta, timezone
import bcrypt, jwt
from typing import Any
from app.core.config import settings

def hash_password(raw: str) -> str:
    return bcrypt.hashpw(raw.encode(), bcrypt.gensalt()).decode()

def verify_password(raw: str, hashed: str | None) -> bool:
    if not hashed:
        return False
    return bcrypt.checkpw(raw.encode(), hashed.encode())

def _create_token(sub: dict[str, Any], expires: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": sub, "iat": int(now.timestamp()), "exp": int((now + expires).timestamp())}
    # 👇 usar nombres correctos del config
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_access_token(user_id: int, org_id: int | None, role_id: int) -> str:
    from app.core.config import settings
    return _create_token({"uid": user_id, "oid": org_id, "rid": role_id},
                         timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))

def create_refresh_token(user_id: int) -> str:
    from app.core.config import settings
    return _create_token({"uid": user_id, "typ": "refresh"},
                         timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))

def decode_token(token: str) -> dict:
    # 👇 igual aquí
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
