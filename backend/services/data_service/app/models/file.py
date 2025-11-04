from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Integer, Enum as SqlEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.enums.file_status import FileStatusEnum
from app.database.db import Base

class FileEntry(Base):
    """
    Metadatos de un solo archivo subido.
    """
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("file_batches.id"), nullable=True)
    organization_id = Column(Integer, nullable=False, index=True)

    original_filename = Column(String(255), nullable=False)
    s3_key_original = Column(String(255), nullable=True)   # Key del PDF, DOCX, etc. en S3
    s3_key_processed = Column(String(255), nullable=True) # Key del .txt procesado en S3

    file_type = Column(String(20), nullable=True) # Ej: "pdf", "docx"
    status = Column(SqlEnum(FileStatusEnum), default=FileStatusEnum.PENDING) 
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True) # Marca cuando llega a ACTIVE
    checksum = Column(String(128), nullable=True) 
    is_active = Column(Boolean, default=True)
    
    # --- Relaciones ---
    batch = relationship("FileBatch", back_populates="files")
    chunks = relationship("DocumentChunk", back_populates="file_entry", cascade="all, delete")