from sqlalchemy import Column, Integer, String, Boolean, Text
from sqlalchemy.orm import relationship
from app.database.db import Base

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # "Labfin" | "Administrador" | "Usuario"
    description = Column(Text, nullable=True)

    users = relationship("User", back_populates="role")
