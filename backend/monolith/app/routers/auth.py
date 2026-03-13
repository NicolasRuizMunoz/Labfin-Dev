import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.config import SECRET_KEY, ALGORITHM
from app.database.db import get_db
from app.dependencies.auth import get_current_user, UserTokenData
from app.schemas.auth import LoginRequest, GoogleLoginRequest, TokenPair, RegisterRequest, UserOut
from app.services.auth.auth_service import login_password, login_google, register
from app.services.auth.security import create_access_token
from app.models.user import User

# No prefix here — main.py mounts this at /api/users
router = APIRouter(tags=["Auth"])

_COOKIE_ACCESS = "access_token"
_COOKIE_REFRESH = "refresh_token"


def _set_cookies(response: Response, tokens: TokenPair) -> None:
    """Write HTTP-only auth cookies so the browser can authenticate silently."""
    opts = dict(httponly=True, samesite="lax", path="/")
    response.set_cookie(_COOKIE_ACCESS,  tokens.access_token,  **opts)
    response.set_cookie(_COOKIE_REFRESH, tokens.refresh_token, **opts)


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    tokens = login_password(db, payload.email, payload.password)
    _set_cookies(response, tokens)
    return tokens


@router.post("/google", response_model=TokenPair)
def google_login(payload: GoogleLoginRequest, response: Response, db: Session = Depends(get_db)):
    tokens = login_google(db, payload.id_token)
    _set_cookies(response, tokens)
    return tokens


@router.post("/register", response_model=UserOut, status_code=201)
def register_route(payload: RegisterRequest, db: Session = Depends(get_db)):
    return register(
        db,
        org_name=payload.org_name,
        org_rut=payload.org_rut,
        email=payload.email,
        username=payload.username,
        password=payload.password,
    )


@router.get("/me", response_model=UserOut)
def me(current: UserTokenData = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.get(User, current.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/refresh", response_model=dict)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    """Use the refresh_token cookie to issue a new access_token."""
    raw = request.cookies.get(_COOKIE_REFRESH)
    if not raw:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(raw, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("typ") != "refresh":
        raise HTTPException(status_code=401, detail="Not a refresh token")

    user_id = int(payload["sub"])
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_access = create_access_token(user.id, user.organization_id)
    response.set_cookie(
        _COOKIE_ACCESS, new_access, httponly=True, samesite="lax", path="/"
    )
    return {"access_token": new_access}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(_COOKIE_ACCESS,  path="/")
    response.delete_cookie(_COOKIE_REFRESH, path="/")
    return {"ok": True}
