from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
import httpx

from app.core.config import settings
from app.utils.tokens import get_access_from_cookies, bearer_header

router = APIRouter()

# Schemas mínimos
class LoginReq(BaseModel):
    email: str
    password: str

class GoogleReq(BaseModel):
    id_token: str

class RegisterOrgAdminReq(BaseModel):
    org_name: str
    org_rut: str
    email: EmailStr
    username: str
    password: str

def set_auth_cookies(resp: Response, access_token: str, refresh_token: str):
    resp.set_cookie(
        key=settings.COOKIE_ACCESS_NAME,
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path="/",
    )
    resp.set_cookie(
        key=settings.COOKIE_REFRESH_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path="/",
    )

@router.post("/login")
async def login(payload: LoginReq):
    url = f"{settings.AUTH_SERVICE_URL}/auth/login"
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, json=payload.model_dump())
    if r.status_code >= 400:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    data = r.json()
    resp = JSONResponse(data)
    set_auth_cookies(resp, data["access_token"], data["refresh_token"])
    return resp

@router.post("/google")
async def login_google(payload: GoogleReq):
    url = f"{settings.AUTH_SERVICE_URL}/auth/google"
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, json=payload.model_dump())
    if r.status_code >= 400:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    data = r.json()
    resp = JSONResponse(data)
    set_auth_cookies(resp, data["access_token"], data["refresh_token"])
    return resp

@router.get("/me")
async def me(request: Request):
    access = get_access_from_cookies(request, settings.COOKIE_ACCESS_NAME)
    headers = bearer_header(access)
    url = f"{settings.AUTH_SERVICE_URL}/auth/me"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, headers=headers)
    if r.status_code >= 400:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()

@router.post("/logout")
async def logout():
    # Si tu auth_service tuviera endpoint /logout, puedes llamarlo aquí
    resp = JSONResponse({"ok": True})
    resp.delete_cookie(settings.COOKIE_ACCESS_NAME, path="/", domain=settings.COOKIE_DOMAIN)
    resp.delete_cookie(settings.COOKIE_REFRESH_NAME, path="/", domain=settings.COOKIE_DOMAIN)
    return resp

@router.post("/register-org-admin")
async def register_org_admin(payload: RegisterOrgAdminReq):
    url = f"{settings.AUTH_SERVICE_URL}/auth/register-org-admin"
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, json=payload.model_dump())
    return JSONResponse(r.json(), status_code=r.status_code)

# Alias opcional para que el front pueda llamar /users/register
@router.post("/register")
async def register_alias(payload: RegisterOrgAdminReq):
    return await register_org_admin(payload)  # reutiliza el de arriba