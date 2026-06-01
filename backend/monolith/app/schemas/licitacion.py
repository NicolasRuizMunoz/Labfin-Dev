from decimal import Decimal
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
    fecha_vencimiento_preguntas: Optional[date] = None


class LicitacionUpdate(BaseModel):
    nombre: Optional[str] = None
    fecha_vencimiento: Optional[date] = None
    fecha_vencimiento_preguntas: Optional[date] = None


class LicitacionResponse(BaseModel):
    id: int
    organization_id: int
    nombre: str
    fecha_vencimiento: Optional[date]
    fecha_vencimiento_preguntas: Optional[date] = None
    created_at: datetime
    files: List[FileSummaryForLicitacion] = []

    codigo_externo: Optional[str] = None
    link_externo: Optional[str] = None
    organismo: Optional[str] = None
    region: Optional[str] = None
    monto_estimado: Optional[Decimal] = None
    moneda: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    estado_mp: Optional[str] = None
    fuente: str = "manual"

    model_config = {"from_attributes": True}