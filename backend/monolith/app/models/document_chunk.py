from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.db import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(Integer, primary_key=True)
    vector_id = Column(String(255), nullable=False, unique=True, index=True)
    file_entry_id = Column(Integer, ForeignKey("files.id", ondelete="CASCADE"))
    organization_id = Column(Integer, nullable=False, index=True)
    content_text = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)

    file_entry = relationship("FileEntry", back_populates="chunks")
