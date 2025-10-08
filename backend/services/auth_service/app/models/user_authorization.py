from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.db import Base
from datetime import datetime, timedelta

class UserAuthorization(Base):
    __tablename__ = "user_authorizations"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=False, index=True, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    invited_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))

    organization = relationship("Organization")
    role = relationship("Role")
    invited_by = relationship("User", foreign_keys=[invited_by_user_id])
