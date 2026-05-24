from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base


class Licitacion(Base):
    __tablename__ = "licitaciones"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    fecha_vencimiento = Column(Date, nullable=True)
    fecha_vencimiento_preguntas = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    google_calendar_event_id = Column(String(255), nullable=True)
    google_calendar_event_id_preguntas = Column(String(255), nullable=True)

    codigo_externo = Column(String(50), nullable=True, index=True)
    link_externo = Column(String(500), nullable=True)
    organismo = Column(String(255), nullable=True)
    region = Column(String(100), nullable=True)
    monto_estimado = Column(Numeric(18, 2), nullable=True)
    moneda = Column(String(10), nullable=True)
    descripcion = Column(Text, nullable=True)
    categoria = Column(String(255), nullable=True)
    estado_mp = Column(String(50), nullable=True)
    fuente = Column(String(20), nullable=False, default="manual")

    files = relationship("FileEntry", back_populates="licitacion")
    analisis = relationship(
        "AnalisisLicitacion",
        back_populates="licitacion",
        order_by="AnalisisLicitacion.created_at.desc()",
        cascade="all, delete",
    )
    simulaciones = relationship(
        "Simulacion",
        back_populates="licitacion",
        cascade="all, delete",
    )
