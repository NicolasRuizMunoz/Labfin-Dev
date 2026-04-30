from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base


class AnalisisLicitacion(Base):
    __tablename__ = "analisis_licitaciones"

    id = Column(Integer, primary_key=True, index=True)
    licitacion_id = Column(Integer, ForeignKey("licitaciones.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Contenido del análisis
    analisis = Column(Text, nullable=False)
    model = Column(String(100), nullable=False)
    tokens_usados = Column(Integer, nullable=True)

    # IDs de archivos usados
    archivos_licitacion_ids = Column(JSON, nullable=True)
    archivos_empresa_ids = Column(JSON, nullable=True)

    # Punto de equilibrio resumido (escenario base)
    # Fórmula: PE (meses) = costo_fijo / (ingreso_mensual - costo_variable_mensual)
    breakeven_costo_fijo = Column(Float, nullable=True)
    breakeven_precio_unitario = Column(Float, nullable=True)
    breakeven_costo_variable_unitario = Column(Float, nullable=True)
    breakeven_unidades = Column(Float, nullable=True)
    breakeven_meses_optimista = Column(Float, nullable=True)
    breakeven_meses_base = Column(Float, nullable=True)
    breakeven_meses_pesimista = Column(Float, nullable=True)
    ingreso_total_contrato = Column(Float, nullable=True)

    # Parámetros por escenario para graficar curvas de ganancia
    # Estructura: {
    #   "meses_total": int,
    #   "optimista":  { "costo_fijo": float, "ingreso_mensual": float, "costo_variable_mensual": float, "descripcion": str },
    #   "base":       { ... },
    #   "pesimista":  { ... }
    # }
    curvas_data = Column(JSON, nullable=True)

    # JSON crudo emitido por EVA: meta, scoring (7 criterios + score_total + recomendacion),
    # factores_externos, alertas, flujo_caja_inicial_requerido, etc.
    extra_data = Column(JSON, nullable=True)

    licitacion = relationship("Licitacion", back_populates="analisis")
