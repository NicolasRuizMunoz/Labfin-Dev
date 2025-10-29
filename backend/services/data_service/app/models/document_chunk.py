from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.db import Base

class DocumentChunk(Base):
    """
    El PUENTE entre SQL y la Base de Datos Vectorial (OpenSearch).
    Almacena los metadatos de cada fragmento de texto.
    """
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True)
    # El ID único que usa tu Vector DB (OpenSearch, FAISS, Pinecone...)
    vector_id = Column(String(255), nullable=False, unique=True, index=True)

    # --- Metadatos Clave para Filtrar y Citar ---
    # 1. A qué archivo pertenece (¡Para las citas!)
    file_entry_id = Column(Integer, ForeignKey("files.id", ondelete="CASCADE"))
    # 2. A qué empresa pertenece (¡Para aislamiento de datos!)
    organization_id = Column(Integer, nullable=False, index=True)
    # 3. El contenido de texto real de este chunk (opcional, pero bueno para debugging)
    content_text = Column(Text, nullable=True)
    # 4. Otros metadatos que OpenSearch usará
    metadata_json = Column(JSON, nullable=True)  # Ej: {"page_number": 3, "s3_path": "path/to/file.txt"}

    # --- Relaciones ---
    file_entry = relationship("FileEntry", back_populates="chunks")