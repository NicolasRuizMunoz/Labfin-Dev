"""
Sentence-Transformers embedding backend.

Supports any model available on HuggingFace Hub.
Uses the E5 prefix convention ("query: " / "passage: ") by default,
which can be disabled via use_e5_prefix=False for non-E5 models.
"""
import logging
from typing import List

import numpy as np

from app.services.embedding.base import BaseEmbedder

LOGGER = logging.getLogger(__name__)


class SentenceTransformerEmbedder(BaseEmbedder):
    def __init__(self, model_name: str, use_e5_prefix: bool = True):
        self._model_name = model_name
        self._use_e5_prefix = use_e5_prefix
        self._model = None
        self._dim: int = 0

    def _load(self):
        if self._model is not None:
            return
        from sentence_transformers import SentenceTransformer
        self._model = SentenceTransformer(self._model_name)
        probe = self._model.encode(["probe"], normalize_embeddings=False)
        self._dim = int(probe.shape[1])
        LOGGER.info(f"[EMBED] Loaded SentenceTransformer '{self._model_name}' (dim={self._dim})")

    @property
    def dim(self) -> int:
        self._load()
        return self._dim

    def embed_query(self, text: str) -> np.ndarray:
        self._load()
        prefixed = f"query: {text}" if self._use_e5_prefix else text
        return self._model.encode([prefixed], normalize_embeddings=False)

    def embed_passages(self, texts: List[str]) -> np.ndarray:
        self._load()
        if self._use_e5_prefix:
            texts = [f"passage: {t}" for t in texts]
        return self._model.encode(texts, normalize_embeddings=False)
