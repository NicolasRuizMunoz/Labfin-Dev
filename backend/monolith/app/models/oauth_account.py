from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base


class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"
    id = Column(Integer, primary_key=True)
    provider = Column(String(30), nullable=False)
    subject = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="oauth_accounts")
    __table_args__ = (UniqueConstraint("provider", "subject", name="uq_oauth_provider_subject"),)
