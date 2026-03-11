from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class FileSummaryForLicitacion(BaseModel):
    id: int
    original_filename: str
    status: str

    model_config = {"from_attributes": True}


class LicitacionCreate(BaseModel):
    nombre: str
    fecha_vencimiento: Optional[date] = None


class LicitacionUpdate(BaseModel):
    nombre: Optional[str] = None
    fecha_vencimiento: Optional[date] = None


class LicitacionResponse(BaseModel):
    id: int
    organization_id: int
    nombre: str
    fecha_vencimiento: Optional[date]
    created_at: datetime
    files: List[FileSummaryForLicitacion] = []

    model_config = {"from_attributes": True}