from pydantic import BaseModel, EmailStr
from typing import Optional

class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    organization_id: Optional[int]
    role_id: int
    is_active: bool
    class Config: from_attributes = True

class RegisterOrgAdmin(BaseModel):
    # crea org + primer admin
    org_name: str
    org_rut: str
    email: EmailStr
    username: str
    password: str
