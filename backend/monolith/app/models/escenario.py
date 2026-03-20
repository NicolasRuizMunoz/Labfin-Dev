from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.db import Base


class Escenario(Base):
    __tablename__ = "escenarios"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=False)
    tipo = Column(String(100), nullable=True)
    parametros = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    simulacion_escenarios = relationship("SimulacionEscenario", back_populates="escenario")
