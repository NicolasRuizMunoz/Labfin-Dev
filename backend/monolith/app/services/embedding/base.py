"""
Abstract base class for all embedding backends.

To add a new backend:
1. Create a new file (e.g. openai.py) with a class that extends BaseEmbedder
2. Register it in factory.py

The two required methods mirror the E5 convention (query vs passage prefix),
but implementations can ignore the distinction if the model doesn't need it.
"""
from abc import ABC, abstractmethod
from typing import List

import numpy as np


class BaseEmbedder(ABC):
    @property
    @abstractmethod
    def dim(self) -> int:
        """Embedding dimension."""

    @abstractmethod
    def embed_query(self, text: str) -> np.ndarray:
        """Embed a single query string. Returns shape (1, dim)."""

    @abstractmethod
    def embed_passages(self, texts: List[str]) -> np.ndarray:
        """Embed a list of document passages. Returns shape (N, dim)."""
