from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Integer, Enum as SqlEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.enums.file_status import FileStatusEnum
from app.database.db import Base


class FileEntry(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, nullable=False, index=True)

    original_filename = Column(String(255), nullable=False)
    s3_key_original = Column(String(255), nullable=True)
    s3_key_processed = Column(String(255), nullable=True)

    file_type = Column(String(20), nullable=True)
    status = Column(SqlEnum(FileStatusEnum), default=FileStatusEnum.PENDING)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    checksum = Column(String(128), nullable=True)
    is_active = Column(Boolean, default=True)

    licitacion_id = Column(Integer, ForeignKey("licitaciones.id"), nullable=True)

    licitacion = relationship("Licitacion", back_populates="files")
    chunks = relationship("DocumentChunk", back_populates="file_entry", cascade="all, delete")
