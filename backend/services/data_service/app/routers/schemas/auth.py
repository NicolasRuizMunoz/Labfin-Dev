from pydantic import BaseModel
from typing import Optional

class UserTokenData(BaseModel):
    sub: str  # user_id
    organization_id: int # Asegúrate que sea int
    role: str