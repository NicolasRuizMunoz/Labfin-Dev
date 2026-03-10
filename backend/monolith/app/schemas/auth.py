from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    org_name: str
    org_rut: str
    email: EmailStr
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    organization_id: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True
