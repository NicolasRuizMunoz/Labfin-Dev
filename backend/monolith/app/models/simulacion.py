from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.db import Base


class Simulacion(Base):
    __tablename__ = "simulaciones"

    id = Column(Integer, primary_key=True, index=True)
    licitacion_id = Column(Integer, ForeignKey("licitaciones.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    color = Column(String(7), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    licitacion = relationship("Licitacion", back_populates="simulaciones")
    simulacion_escenarios = relationship(
        "SimulacionEscenario",
        back_populates="simulacion",
        cascade="all, delete",
    )
    analisis = relationship(
        "AnalisisSimulacion",
        back_populates="simulacion",
        cascade="all, delete",
        order_by="AnalisisSimulacion.created_at.desc()",
    )


class SimulacionEscenario(Base):
    __tablename__ = "simulacion_escenarios"

    id = Column(Integer, primary_key=True)
    simulacion_id = Column(Integer, ForeignKey("simulaciones.id", ondelete="CASCADE"), nullable=False)
    escenario_id = Column(Integer, ForeignKey("escenarios.id", ondelete="RESTRICT"), nullable=False)

    __table_args__ = (
        UniqueConstraint("simulacion_id", "escenario_id", name="uq_sim_esc"),
    )

    simulacion = relationship("Simulacion", back_populates="simulacion_escenarios")
    escenario = relationship("Escenario", back_populates="simulacion_escenarios")


class AnalisisSimulacion(Base):
    __tablename__ = "analisis_simulacion"

    id = Column(Integer, primary_key=True, index=True)
    simulacion_id = Column(Integer, ForeignKey("simulaciones.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Integer, nullable=False, index=True)
    analisis = Column(Text, nullable=False)
    model = Column(String(100), nullable=False)
    tokens_usados = Column(Integer, nullable=True)
    curva_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_anasim_sim", "simulacion_id"),
        Index("idx_anasim_org", "organization_id"),
    )

    simulacion = relationship("Simulacion", back_populates="analisis")
