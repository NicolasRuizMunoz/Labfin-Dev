from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Numeric
from datetime import datetime

from app.database.db import Base


class EtiquetaBusqueda(Base):
    """User-defined search tag used to pull matching tenders from MercadoPúblico."""
    __tablename__ = "etiquetas_busqueda"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    keywords = Column(JSON, nullable=True)
    regiones = Column(JSON, nullable=True)
    categorias = Column(JSON, nullable=True)
    monto_min = Column(Numeric(18, 2), nullable=True)
    monto_max = Column(Numeric(18, 2), nullable=True)
    activa = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
