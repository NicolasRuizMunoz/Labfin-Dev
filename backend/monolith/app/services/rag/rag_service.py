"""
RAG orchestration — direct function call, no inter-service HTTP.
chat_service calls generate_answer() directly.
"""
import logging
from typing import List, Dict, Optional

from app.config import MAX_SOURCES, MAX_CHARS_PER_CHUNK
from app.services.rag.prompt import build_system_prompt, build_user_prompt
from app.services.rag.model_client import generate_text, ModelBackendError

LOGGER = logging.getLogger(__name__)


async def generate_answer(query: str, sources: List[Dict]) -> Optional[str]:
    """
    Build prompts from query + retrieved sources and call OpenAI.
    Returns the LLM answer string, or None on failure.
    """
    top = sources[:MAX_SOURCES]
    sys_prompt = build_system_prompt()
    user_prompt = build_user_prompt(query=query, sources=top, max_chars_per_chunk=MAX_CHARS_PER_CHUNK)

    try:
        answer = await generate_text(system_prompt=sys_prompt, user_prompt=user_prompt)
        return answer
    except ModelBackendError as e:
        LOGGER.warning(f"[RAG] OpenAI unavailable, falling back to structured response: {e}")
        return None
