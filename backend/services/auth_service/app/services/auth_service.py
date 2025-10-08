from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.models.user import User
from app.models.role import Role
from app.models.organization import Organization
from app.models.user_authorization import UserAuthorization
from app.models.oauth_account import OAuthAccount

from app.schemas.auth import TokenPair

def _issue_tokens(user: User) -> TokenPair:
    access = create_access_token(user.id, user.organization_id, user.role_id)
    refresh = create_refresh_token(user.id)
    return TokenPair(access_token=access, refresh_token=refresh)

def login_password(db: Session, email: str, password: str) -> TokenPair:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password) or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _issue_tokens(user)

def login_google(db: Session, id_token: str) -> TokenPair:
    try:
        payload = google_id_token.verify_oauth2_token(id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
        # payload contiene: sub, email, email_verified, name, picture, ...
        email = payload.get("email")
        sub = payload.get("sub")
        if not email or not sub:
            raise ValueError("Invalid Google token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google ID token")

    # 1) ¿Existe cuenta vinculada por oauth?
    acct = db.query(OAuthAccount).filter(OAuthAccount.provider=="google", OAuthAccount.subject==sub).first()
    if acct:
        user = acct.user
    else:
        # 2) ¿Existe usuario por email? si no, créalo
        user = db.query(User).filter(User.email==email).first()
        if not user:
            # asigna rol base "Usuario" (ajusta ID si tienes semilla fija)
            role_user = db.query(Role).filter(Role.name=="Usuario").first()
            if not role_user:
                raise HTTPException(500, "Missing base role 'Usuario'")
            user = User(
                email=email,
                username=email.split("@")[0],
                hashed_password=None,
                role_id=role_user.id,
                is_active=True,
            )
            # Si hay una invitación pendiente por email → asigna org/rol
            invite = db.query(UserAuthorization)\
                       .filter(UserAuthorization.email==email, UserAuthorization.used==False)\
                       .order_by(UserAuthorization.created_at.desc())\
                       .first()
            if invite:
                user.organization_id = invite.organization_id
                user.role_id = invite.role_id
                invite.used = True

            db.add(user)
            db.flush()

        # Vincula cuenta oauth
        acct = OAuthAccount(provider="google", subject=sub, email=email, user_id=user.id)
        db.add(acct)

    db.commit()
    db.refresh(user)
    return _issue_tokens(user)

def register_org_admin(db: Session, *, org_name: str, org_rut: str, email: str, username: str, password: str) -> User:
    if db.query(User).filter(User.email==email).first():
        raise HTTPException(400, "Email already registered")

    role_admin = db.query(Role).filter(Role.name=="Administrador").first()
    if not role_admin:
        raise HTTPException(500, "Missing role 'Administrador'")

    org = Organization(name=org_name, rut=org_rut, is_active=False)
    db.add(org); db.flush()

    user = User(
        email=email,
        username=username,
        hashed_password=hash_password(password),
        organization_id=org.id,
        role_id=role_admin.id,
        is_active=True
    )
    db.add(user); db.commit(); db.refresh(user)
    return user
