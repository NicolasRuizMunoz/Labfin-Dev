"""
Centralised OpenAI token-usage tracking.

Call `record_usage()` right after every OpenAI API response.
"""
import logging
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.models.token_usage import TokenUsage

logger = logging.getLogger(__name__)

# Pricing per 1M tokens (USD) — update when models change
_PRICE_INPUT = {
    "gpt-4o-mini": 0.15, "gpt-4o": 2.50,
    "gpt-4.1-mini": 0.40, "gpt-4.1": 2.00,
}
_PRICE_OUTPUT = {
    "gpt-4o-mini": 0.60, "gpt-4o": 10.00,
    "gpt-4.1-mini": 1.60, "gpt-4.1": 8.00,
}


def estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> Decimal:
    rate_in = _PRICE_INPUT.get(model, 1.0)
    rate_out = _PRICE_OUTPUT.get(model, 4.0)
    return Decimal(str((prompt_tokens * rate_in + completion_tokens * rate_out) / 1_000_000))


def record_usage(
    db: Session,
    *,
    organization_id: int,
    user_id: int,
    usage_type: str,          # "analysis" | "chat"
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: Optional[int] = None,
) -> TokenUsage:
    cost = estimate_cost(model, prompt_tokens, completion_tokens)
    entry = TokenUsage(
        organization_id=organization_id,
        user_id=user_id,
        usage_type=usage_type,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens or (prompt_tokens + completion_tokens),
        estimated_cost_usd=cost,
    )
    db.add(entry)
    db.commit()
    logger.info(
        "[TOKEN_USAGE] org=%s user=%s type=%s model=%s tokens=%d cost=$%.6f",
        organization_id, user_id, usage_type, model,
        entry.total_tokens, cost,
    )
    return entry
