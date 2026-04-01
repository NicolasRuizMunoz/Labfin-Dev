from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.db import Base

import enum


class RoleEnum(str, enum.Enum):
    client = "client"
    evalitics = "evalitics"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    role = Column(SAEnum(RoleEnum), nullable=False, default=RoleEnum.client, server_default="client")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    reset_code_hash = Column(String(255), nullable=True)
    reset_code_expires_at = Column(DateTime, nullable=True)

    organization = relationship("Organization", back_populates="users")
    oauth_accounts = relationship("OAuthAccount", back_populates="user")
