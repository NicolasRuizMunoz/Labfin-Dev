from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS


def hash_password(raw: str) -> str:
    return bcrypt.hashpw(raw.encode(), bcrypt.gensalt()).decode()


def verify_password(raw: str, hashed: str | None) -> bool:
    if not hashed:
        return False
    return bcrypt.checkpw(raw.encode(), hashed.encode())


def _create_token(sub: str, extra_claims: dict[str, Any], expires: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "iat": int(now.timestamp()),
        "exp": int((now + expires).timestamp()),
        **extra_claims,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(user_id: int, org_id: int | None) -> str:
    return _create_token(
        sub=str(user_id),
        extra_claims={"organization_id": org_id},
        expires=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: int) -> str:
    return _create_token(
        sub=str(user_id),
        extra_claims={"typ": "refresh"},
        expires=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
