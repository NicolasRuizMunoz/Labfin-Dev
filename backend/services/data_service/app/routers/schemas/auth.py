from pydantic import BaseModel
from typing import Optional

class UserTokenData(BaseModel):
    sub: str
    organization_id: Optional[int] = None
    role_id: Optional[int] = None