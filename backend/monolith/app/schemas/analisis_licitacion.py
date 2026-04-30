from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class AnalisisLicitacionResponse(BaseModel):
    id: int
    licitacion_id: int
    organization_id: int
    created_at: datetime

    analisis: str
    model: str
    tokens_usados: Optional[int]

    archivos_licitacion_ids: Optional[List[int]]
    archivos_empresa_ids: Optional[List[int]]

    # Punto de equilibrio (escenario base)
    breakeven_costo_fijo: Optional[float]
    breakeven_precio_unitario: Optional[float]
    breakeven_costo_variable_unitario: Optional[float]
    breakeven_unidades: Optional[float]
    breakeven_meses_optimista: Optional[float]
    breakeven_meses_base: Optional[float]
    breakeven_meses_pesimista: Optional[float]
    ingreso_total_contrato: Optional[float]

    # Parámetros por escenario para gráfico de curvas
    curvas_data: Optional[Any]

    # Bloque JSON estructurado emitido por EVA (scoring, alertas, factores externos, meta)
    extra_data: Optional[Any] = None

    model_config = {"from_attributes": True}
