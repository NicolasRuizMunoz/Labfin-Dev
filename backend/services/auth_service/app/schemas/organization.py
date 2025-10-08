from pydantic import BaseModel

class OrganizationOut(BaseModel):
    id: int
    name: str
    rut: str
    is_active: bool
    class Config: from_attributes = True
