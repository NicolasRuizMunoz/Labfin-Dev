from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.schemas.auth import LoginRequest, GoogleLoginRequest, TokenPair
from app.schemas.user import RegisterOrgAdmin, UserOut
from app.services.auth_service import login_password, login_google, register_org_admin
from app.dependencies.auth import get_current_user_data, UserTokenData

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return login_password(db, payload.email, payload.password)

@router.post("/google", response_model=TokenPair)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    return login_google(db, payload.id_token)

@router.post("/register-org-admin", response_model=UserOut)
def register_org_admin_route(payload: RegisterOrgAdmin, db: Session = Depends(get_db)):
    user = register_org_admin(db,
        org_name=payload.org_name, org_rut=payload.org_rut,
        email=payload.email, username=payload.username, password=payload.password
    )
    return user

@router.get("/me", response_model=UserOut)
def me_route(current: UserTokenData = Depends(get_current_user_data)):
    return UserOut(id=current.user_id, email="hidden@example.com", username="(token)",  # opcional: consulta DB si necesitas todo
                   organization_id=current.organization_id, role_id=current.role_id, is_active=True)
