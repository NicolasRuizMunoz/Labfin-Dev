from fastapi import Header, HTTPException
from jose import jwt, JWTError
from app.config import SECRET_KEY, ALGORITHM
from app.routers.schemas import UserTokenData

def get_current_user_data(authorization: str | None = Header(default=None)) -> UserTokenData:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Token NUEVO: sub es string; org/role vienen como claims hermanos
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise HTTPException(status_code=401, detail="Invalid token payload (sub must be string)")

    org_id = payload.get("organization_id")
    role_id = payload.get("role_id")

    return UserTokenData(
        sub=sub,
        organization_id=org_id,
        role_id=role_id,
    )
