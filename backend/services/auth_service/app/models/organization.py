from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database.db import Base
from datetime import datetime

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)       # razón social
    address = Column(String(255), nullable=True)
    phone_number = Column(String(20), nullable=True)
    rut = Column(String(20), unique=True, nullable=False)
    category = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="organization")

    def __repr__(self):
        return f"<Organization(name={self.name}, rut={self.rut})>"
