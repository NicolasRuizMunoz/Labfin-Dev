from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    id_token: str   # token del Google Identity Services

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
