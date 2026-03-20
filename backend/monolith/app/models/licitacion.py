from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base


class Licitacion(Base):
    __tablename__ = "licitaciones"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    fecha_vencimiento = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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
