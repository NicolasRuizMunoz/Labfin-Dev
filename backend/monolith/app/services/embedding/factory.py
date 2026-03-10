"""
Embedder factory.

Controls which embedding backend is active via environment variables:
  EMBED_BACKEND=sentence_transformer   (default)
  EMBED_MODEL=intfloat/multilingual-e5-small

Adding a new backend:
  1. Create a class in a new file that extends BaseEmbedder
  2. Add a branch in get_embedder() below

The singleton _embedder is lazily initialised the first time get_embedder()
is called, so model weights are not downloaded at import time.
"""
import logging
from typing import Optional

from app.services.embedding.base import BaseEmbedder

LOGGER = logging.getLogger(__name__)
_embedder: Optional[BaseEmbedder] = None


def get_embedder() -> BaseEmbedder:
    """Return the global embedder singleton, creating it on first call."""
    global _embedder
    if _embedder is not None:
        return _embedder

    from app.config import EMBED_BACKEND, EMBED_MODEL

    if EMBED_BACKEND == "sentence_transformer":
        from app.services.embedding.sentence_transformer import SentenceTransformerEmbedder
        # Use E5 prefix only for E5-family models
        use_e5 = "e5" in EMBED_MODEL.lower()
        _embedder = SentenceTransformerEmbedder(model_name=EMBED_MODEL, use_e5_prefix=use_e5)
        LOGGER.info(f"[EMBED_FACTORY] Backend=sentence_transformer model={EMBED_MODEL}")

    # ── Add new backends here ──────────────────────────────────────────────
    # elif EMBED_BACKEND == "openai":
    #     from app.services.embedding.openai import OpenAIEmbedder
    #     _embedder = OpenAIEmbedder(model=EMBED_MODEL)
    #
    # elif EMBED_BACKEND == "ollama":
    #     from app.services.embedding.ollama import OllamaEmbedder
    #     _embedder = OllamaEmbedder(model=EMBED_MODEL)
    # ──────────────────────────────────────────────────────────────────────

    else:
        raise ValueError(
            f"Unknown EMBED_BACKEND='{EMBED_BACKEND}'. "
            "Supported: 'sentence_transformer'. "
            "Add your backend in services/embedding/factory.py."
        )

    return _embedder
