from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Header
from app.config import SECRET_KEY, ALGORITHM, N8N_SECRET_KEY
from app.routers.schemas import UserTokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# 🔐 Para obtener al usuario autenticado en rutas protegidas
from fastapi import Request

def get_current_user_data(request: Request) -> UserTokenData:
    token = request.cookies.get("access_token")

    # Fallback: buscar en header si no está en cookies
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=401, detail="Token faltante o inválido")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return UserTokenData(
            sub=payload.get("sub"),
            empresa_id=payload.get("empresa_id"),
            role=payload.get("role")
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

# 🔐 Para generar tokens internos para n8n u otros sistemas
def create_internal_n8n_token(
    batch_id: int,
    empresa_id: int,
    sub: str = "internal_system",
    expires_minutes: int = 5
) -> str:
    payload = {
        "iss": "evalitics",
        "purpose": "trigger_n8n",
        "exp": datetime.utcnow() + timedelta(minutes=expires_minutes),
        "sub": sub,
        "empresa_id": empresa_id,
        "batch_id": batch_id
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_n8n_key(x_api_key: str = Header(...)):
    if x_api_key != N8N_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clave de API inválida"
        )