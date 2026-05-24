from decimal import Decimal
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class EtiquetaBusquedaBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    keywords: List[str] = Field(default_factory=list)
    regiones: List[str] = Field(default_factory=list)
    categorias: List[str] = Field(default_factory=list)
    monto_min: Optional[Decimal] = None
    monto_max: Optional[Decimal] = None
    activa: bool = True


class EtiquetaBusquedaCreate(EtiquetaBusquedaBase):
    pass


class EtiquetaBusquedaUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, max_length=100)
    keywords: Optional[List[str]] = None
    regiones: Optional[List[str]] = None
    categorias: Optional[List[str]] = None
    monto_min: Optional[Decimal] = None
    monto_max: Optional[Decimal] = None
    activa: Optional[bool] = None


class EtiquetaBusquedaResponse(EtiquetaBusquedaBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScrapeRunResponse(BaseModel):
    etiquetas_evaluadas: int
    licitaciones_revisadas: int
    licitaciones_nuevas: int
    licitaciones_actualizadas: int
    errores: List[str] = Field(default_factory=list)


class DescubrirRunResponse(BaseModel):
    dias: int
    licitaciones_revisadas: int
    licitaciones_nuevas: int
    licitaciones_actualizadas: int
    errores: List[str] = Field(default_factory=list)
