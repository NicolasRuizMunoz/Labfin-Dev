import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config import GOOGLE_CLIENT_ID, DEV_MODE, SECRET_KEY, ALGORITHM, RESET_CODE_EXPIRE_MINUTES
from app.services.auth.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
)
from app.services.auth.email import send_reset_code_email
from app.models.user import User
from app.models.organization import Organization
from app.models.oauth_account import OAuthAccount
from app.schemas.auth import TokenPair

logger = logging.getLogger(__name__)


def _issue_tokens(user: User) -> TokenPair:
    access = create_access_token(user.id, user.organization_id, user.role)
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
    except Exception as exc:
        logger.warning("Google OAuth token verification failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid Google ID token")

    acct = db.query(OAuthAccount).filter(
        OAuthAccount.provider == "google", OAuthAccount.subject == sub
    ).first()

    if acct:
        user = acct.user
    else:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, username=email.split("@")[0], hashed_password=None, role="client", is_active=True)
            db.add(user)
            db.flush()
        acct = OAuthAccount(provider="google", subject=sub, email=email, user_id=user.id)
        db.add(acct)

    db.commit()
    db.refresh(user)
    return _issue_tokens(user)


_DEV_BYPASS_PASSWORDS = {"qwerty"} if DEV_MODE else set()


def _validate_password(password: str) -> None:
    if _DEV_BYPASS_PASSWORDS and password in _DEV_BYPASS_PASSWORDS:
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


# ── Password reset ────────────────────────────────────────────────────────────

def request_password_reset(db: Session, email: str) -> None:
    """Generate a 6-digit code, store its hash, and email it to the user."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(400, "No existe una cuenta asociada a este correo.")

    code = f"{secrets.randbelow(10**6):06d}"
    user.reset_code_hash = hash_password(code)
    # MySQL DATETIME is timezone-naive, so store naive UTC
    user.reset_code_expires_at = datetime.utcnow() + timedelta(minutes=RESET_CODE_EXPIRE_MINUTES)
    db.commit()

    send_reset_code_email(email, code)


def verify_reset_code(db: Session, email: str, code: str) -> str:
    """Check the 6-digit code and return a short-lived JWT reset token."""
    import jwt as _jwt

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.reset_code_hash or not user.reset_code_expires_at:
        raise HTTPException(400, "Código incorrecto o expirado.")

    if datetime.utcnow() > user.reset_code_expires_at:
        raise HTTPException(400, "Código incorrecto o expirado.")

    if not verify_password(code, user.reset_code_hash):
        raise HTTPException(400, "Código incorrecto o expirado.")

    # Invalidate the code so it can't be reused
    user.reset_code_hash = None
    user.reset_code_expires_at = None
    db.commit()

    # Issue a short-lived reset token (10 min)
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "typ": "reset",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=10)).timestamp()),
    }
    return _jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def confirm_password_reset(db: Session, token: str, new_password: str) -> None:
    """Decode the reset token and set the new password."""
    import jwt as _jwt

    try:
        payload = _jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except _jwt.ExpiredSignatureError:
        raise HTTPException(400, "El enlace de recuperación ha expirado.")
    except _jwt.InvalidTokenError:
        raise HTTPException(400, "Token de recuperación inválido.")

    if payload.get("typ") != "reset":
        raise HTTPException(400, "Token de recuperación inválido.")

    _validate_password(new_password)

    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(400, "Usuario no encontrado.")

    user.hashed_password = hash_password(new_password)
    user.reset_code_hash = None
    user.reset_code_expires_at = None
    db.commit()


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
        role="client",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
