# auth_service/core/security.py
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

def _create_token(sub: str, extra_claims: dict[str, Any], expires: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,                              # ← string
        "iat": int(now.timestamp()),
        "exp": int((now + expires).timestamp()),
        **extra_claims,                          # ← claims hermanos
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_access_token(user_id: int, org_id: int | None, role_id: int) -> str:
    return _create_token(
        sub=str(user_id),                        # ← string
        extra_claims={
            "organization_id": org_id,          # ← fuera de sub
            "role_id": role_id,                 # ← fuera de sub
        },
        expires=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

def create_refresh_token(user_id: int) -> str:
    return _create_token(
        sub=str(user_id),                        # ← string
        extra_claims={"typ": "refresh"},
        expires=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
