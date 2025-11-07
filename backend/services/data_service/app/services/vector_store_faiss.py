# app/services/vector_store_faiss.py
import os
import json
import logging
from typing import List, Dict, Tuple
import numpy as np

try:
    import faiss  # faiss-cpu
except Exception as e:
    raise RuntimeError("Instala faiss-cpu: pip install faiss-cpu") from e

LOGGER = logging.getLogger(__name__)

BASE_DIR = os.environ.get("FAISS_DIR", "data/faiss")
os.makedirs(BASE_DIR, exist_ok=True)

class FaissStore:
    """
    Un índice FAISS por organización. Mantiene:
    - {org_id}.index  -> índice vectorial
    - {org_id}.meta.json -> lista de metadatos por vector en mismo orden
    """
    def __init__(self, org_id: int, dim: int):
        self.org_id = int(org_id)
        self.dim = dim
        self.index_path = os.path.join(BASE_DIR, f"{self.org_id}.index")
        self.meta_path  = os.path.join(BASE_DIR, f"{self.org_id}.meta.json")
        self.index = None
        self.meta  = []  # List[dict]
        self._load()

    def _load(self):
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
            LOGGER.info(f"[FAISS] Loaded index: {self.index_path}")
        else:
            self.index = faiss.IndexFlatIP(self.dim)  # coseno usando vectores normalizados
            LOGGER.info(f"[FAISS] Created new index (dim={self.dim}) for org={self.org_id}")

        if os.path.exists(self.meta_path):
            with open(self.meta_path, "r", encoding="utf-8") as f:
                self.meta = json.load(f)
        else:
            self.meta = []

    def _save(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.meta_path, "w", encoding="utf-8") as f:
            json.dump(self.meta, f, ensure_ascii=False)

    @staticmethod
    def _normalize(vectors: np.ndarray) -> np.ndarray:
        # normalización L2 para usar dot-product como coseno
        norms = np.linalg.norm(vectors, axis=1, keepdims=True) + 1e-12
        return vectors / norms

    def add(self, vectors: np.ndarray, metas: List[Dict]):
        assert vectors.ndim == 2 and vectors.shape[0] == len(metas)
        vectors = self._normalize(vectors.astype("float32"))
        self.index.add(vectors)
        self.meta.extend(metas)
        self._save()
        LOGGER.info(f"[FAISS] Added {vectors.shape[0]} vectors to org={self.org_id}")

    def search(self, query_vec: np.ndarray, top_k: int = 5) -> List[Tuple[float, Dict]]:
        query_vec = self._normalize(query_vec.reshape(1, -1).astype("float32"))
        D, I = self.index.search(query_vec, top_k)
        results = []
        for score, idx in zip(D[0], I[0]):
            if idx < 0 or idx >= len(self.meta):
                continue
            results.append((float(score), self.meta[idx]))
        return results

    def rebuild(self, vectors: np.ndarray, metas: List[Dict]):
        self.index = faiss.IndexFlatIP(self.dim)
        self.meta = []
        if vectors.size > 0:
            self.add(vectors, metas)
        else:
            self._save()
        LOGGER.info(f"[FAISS] Rebuilt index for org={self.org_id}: {len(metas)} vectors")
