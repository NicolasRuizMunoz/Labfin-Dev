from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base

class FileBatch(Base):
    """
    Agrupa archivos subidos en una misma "carga".
    Esencial para la gestión de datos (ej. "Eliminar carga de Impuestos 2023").
    """
    __tablename__ = "file_batches"

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, nullable=False, index=True)
    name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Un lote tiene muchos archivos
    files = relationship("FileEntry", back_populates="batch", cascade="all, delete")