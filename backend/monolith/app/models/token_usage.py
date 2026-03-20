from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric, Enum as SAEnum, Index
from datetime import datetime, timezone
from app.database.db import Base

import enum


class UsageTypeEnum(str, enum.Enum):
    analysis = "analysis"
    chat = "chat"
    scenario_analysis = "scenario_analysis"


class TokenUsage(Base):
    __tablename__ = "token_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    usage_type = Column(SAEnum(UsageTypeEnum), nullable=False)
    model = Column(String(50), nullable=False)
    prompt_tokens = Column(Integer, nullable=False, default=0)
    completion_tokens = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)
    estimated_cost_usd = Column(Numeric(10, 6), nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_token_usage_org_created", "organization_id", "created_at"),
        Index("idx_token_usage_org_type", "organization_id", "usage_type"),
        Index("idx_token_usage_user", "user_id"),
    )
