from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.escenario import EscenarioOut


class SimulacionCreate(BaseModel):
    nombre: str
    color: Optional[str] = None
    escenario_ids: List[int]


class SimulacionUpdate(BaseModel):
    nombre: Optional[str] = None
    color: Optional[str] = None
    escenario_ids: Optional[List[int]] = None
    is_active: Optional[bool] = None


class AnalisisSimulacionOut(BaseModel):
    id: int
    analisis: str
    model: str
    tokens_usados: Optional[int]
    curva_data: Optional[dict]
    created_at: datetime

    model_config = {"from_attributes": True}


class SimulacionOut(BaseModel):
    id: int
    nombre: str
    color: Optional[str]
    is_active: bool
    escenarios: List[EscenarioOut] = []
    ultimo_analisis: Optional[AnalisisSimulacionOut] = None
    created_at: datetime

    model_config = {"from_attributes": True}
