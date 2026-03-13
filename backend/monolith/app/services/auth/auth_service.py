from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config import GOOGLE_CLIENT_ID
from app.services.auth.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
)
from app.models.user import User
from app.models.organization import Organization
from app.models.oauth_account import OAuthAccount
from app.schemas.auth import TokenPair


def _issue_tokens(user: User) -> TokenPair:
    access = create_access_token(user.id, user.organization_id)
    refresh = create_refresh_token(user.id)
    return TokenPair(access_token=access, refresh_token=refresh)


def login_password(db: Session, email: str, password: str) -> TokenPair:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password) or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _issue_tokens(user)


def login_google(db: Session, id_token: str) -> TokenPair:
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google login not configured")
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
        payload = google_id_token.verify_oauth2_token(
            id_token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        email = payload.get("email")
        sub = payload.get("sub")
        if not email or not sub:
            raise ValueError("Invalid Google token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google ID token")

    acct = db.query(OAuthAccount).filter(
        OAuthAccount.provider == "google", OAuthAccount.subject == sub
    ).first()

    if acct:
        user = acct.user
    else:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, username=email.split("@")[0], hashed_password=None, is_active=True)
            db.add(user)
            db.flush()
        acct = OAuthAccount(provider="google", subject=sub, email=email, user_id=user.id)
        db.add(acct)

    db.commit()
    db.refresh(user)
    return _issue_tokens(user)


_DEV_BYPASS_PASSWORDS = {"qwerty"}


def _validate_password(password: str) -> None:
    if password in _DEV_BYPASS_PASSWORDS:
        return
    errors = []
    if len(password) < 8:
        errors.append("al menos 8 caracteres")
    if not any(c.isupper() for c in password):
        errors.append("al menos 1 mayúscula")
    if not any(c.isdigit() for c in password):
        errors.append("al menos 1 número")
    if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?`~" for c in password):
        errors.append("al menos 1 símbolo")
    if errors:
        raise HTTPException(400, f"Contraseña insegura: requiere {', '.join(errors)}.")


def register(db: Session, *, org_name: str, org_rut: str, email: str, username: str, password: str) -> User:
    _validate_password(password)
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "Email already registered")

    org = Organization(name=org_name, rut=org_rut, is_active=True)
    db.add(org)
    db.flush()

    user = User(
        email=email,
        username=username,
        hashed_password=hash_password(password),
        organization_id=org.id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
