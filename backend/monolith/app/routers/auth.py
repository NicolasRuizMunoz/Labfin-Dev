import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.config import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS,
    SECURE_COOKIES,
)
from app.database.db import get_db
from app.dependencies.auth import get_current_user, UserTokenData
from app.schemas.auth import (
    LoginRequest, GoogleLoginRequest, TokenPair, RegisterRequest, UserOut,
    PasswordResetRequest, PasswordResetVerify, PasswordResetConfirm,
)
from app.services.auth.auth_service import (
    login_password, login_google, register,
    request_password_reset, verify_reset_code, confirm_password_reset,
)
from app.services.auth.security import create_access_token, create_refresh_token
from app.services.auth.token_blacklist import blacklist_token
from app.models.user import User

# No prefix here — main.py mounts this at /api/users
router = APIRouter(tags=["Auth"])

_COOKIE_ACCESS = "access_token"
_COOKIE_REFRESH = "refresh_token"


def _cookie_opts() -> dict:
    # Production (HTTPS, cross-origin): SameSite=None + Secure=True
    # Development (HTTP, Vite proxy same-origin): SameSite=Lax + Secure=False
    return dict(
        httponly=True,
        samesite="none" if SECURE_COOKIES else "lax",
        secure=SECURE_COOKIES,
        path="/",
    )


def _set_cookies(response: Response, tokens: TokenPair) -> None:
    """Write HTTP-only auth cookies so the browser can authenticate silently."""
    opts = _cookie_opts()
    response.set_cookie(
        _COOKIE_ACCESS, tokens.access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        **opts,
    )
    response.set_cookie(
        _COOKIE_REFRESH, tokens.refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        **opts,
    )


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
    """Use the refresh_token cookie to issue a new access_token and rotate the refresh_token."""
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

    # Blacklist the old refresh token so it cannot be reused
    blacklist_token(raw)

    # Issue new token pair (rotation)
    new_access = create_access_token(user.id, user.organization_id, user.role)
    new_refresh = create_refresh_token(user.id)

    opts = _cookie_opts()
    response.set_cookie(
        _COOKIE_ACCESS, new_access,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        **opts,
    )
    response.set_cookie(
        _COOKIE_REFRESH, new_refresh,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        **opts,
    )
    return {"access_token": new_access}


@router.post("/password-reset/request", status_code=200)
def password_reset_request(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    request_password_reset(db, payload.email)
    return {"ok": True}


@router.post("/password-reset/verify")
def password_reset_verify(payload: PasswordResetVerify, db: Session = Depends(get_db)):
    token = verify_reset_code(db, payload.email, payload.code)
    return {"token": token}


@router.post("/password-reset/confirm", status_code=200)
def password_reset_confirm(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    confirm_password_reset(db, payload.token, payload.password)
    return {"ok": True}


@router.post("/logout")
def logout(request: Request, response: Response):
    # Blacklist current tokens so they can't be reused
    access = request.cookies.get(_COOKIE_ACCESS)
    refresh = request.cookies.get(_COOKIE_REFRESH)
    if access:
        blacklist_token(access)
    if refresh:
        blacklist_token(refresh)

    opts = _cookie_opts()
    response.delete_cookie(_COOKIE_ACCESS, **opts)
    response.delete_cookie(_COOKIE_REFRESH, **opts)
    return {"ok": True}
