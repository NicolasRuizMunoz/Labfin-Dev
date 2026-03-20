from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EscenarioCreate(BaseModel):
    nombre: str
    descripcion: str
    tipo: Optional[str] = None
    parametros: Optional[dict] = None


class EscenarioUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    parametros: Optional[dict] = None


class EscenarioOut(BaseModel):
    id: int
    nombre: str
    descripcion: str
    tipo: Optional[str]
    parametros: Optional[dict]
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: datetime
    simulaciones_count: int = 0

    model_config = {"from_attributes": True}
