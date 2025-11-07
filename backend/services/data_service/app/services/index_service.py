# app/services/index_service.py
import os
import json
import logging
from typing import List, Dict, Optional, Iterable
from dataclasses import dataclass

import numpy as np
from sqlalchemy.orm import Session

from app.services.vector_store_faiss import FaissStore
from app.database.db import SessionLocal
from app.services import file_service, s3_service
from app.models import DocumentChunk  # tu modelo
from app.config import PROCESSED_DIR

LOGGER = logging.getLogger(__name__)

# ---- Embeddings (ligero bilingüe) ----
# Requiere: pip install sentence-transformers
_EMBED_MODEL_NAME = os.environ.get("EMBED_MODEL", "intfloat/multilingual-e5-small")

@dataclass
class Embedder:
    model = None
    dim: int = 384  # e5-small -> 384; si cambias modelo ajusta dim

    def __post_init__(self):
        if self.model is None:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(_EMBED_MODEL_NAME)
            # inferir dim real:
            test = self.model.encode(["hola"], normalize_embeddings=False)
            self.dim = int(test.shape[1])
            LOGGER.info(f"[EMBED] Loaded {_EMBED_MODEL_NAME} (dim={self.dim})")

    def embed_query(self, text: str) -> np.ndarray:
        # E5: prefijo "query: "
        return self.model.encode([f"query: {text}"], normalize_embeddings=False)

    def embed_passages(self, texts: List[str]) -> np.ndarray:
        # E5: prefijo "passage: "
        return self.model.encode([f"passage: {t}" for t in texts], normalize_embeddings=False)

_EMBEDDER = Embedder()  # singleton simple

# ---- Chunking básico ----
def simple_chunk(text: str, max_tokens: int = 400, overlap: int = 50) -> List[str]:
    """
    Chunk naive por palabras. Sustituye por token-aware si quieres.
    """
    words = text.split()
    chunks = []
    i = 0
    step = max_tokens - overlap
    while i < len(words):
        j = min(len(words), i + max_tokens)
        chunks.append(" ".join(words[i:j]))
        i += step
    return chunks

# ---- Utilidad: asegurar TXT local (descarga de S3 si hace falta) ----
def ensure_local_processed_txt(fe) -> str:
    base_name = f"{fe.organization_id}__{fe.batch_id or 'no-batch'}__{fe.original_filename}"
    txt_name  = os.path.splitext(base_name)[0] + ".txt"
    local_txt = os.path.join(PROCESSED_DIR, txt_name)
    if os.path.exists(local_txt):
        return local_txt
    # descargar desde S3 si no existe local
    if not fe.s3_key_processed:
        raise FileNotFoundError("No hay s3_key_processed para este archivo")
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    out_path = os.path.join(PROCESSED_DIR, os.path.basename(fe.s3_key_processed).split("/")[-1])
    ok = s3_service.download_file(fe.s3_key_processed, out_path)
    if not ok:
        raise IOError(f"No se pudo descargar {fe.s3_key_processed} desde S3")
    return out_path

# ---- Indexado de un archivo ----
def index_file(db: Session, file_id: int) -> int:
    """
    Lee el TXT (local o S3), chunquea, embebe y añade a FAISS + persiste DocumentChunk.
    Devuelve cantidad de chunks indexados.
    """
    fe = file_service.get_file_by_id_raw(db, file_id)  # impleméntalo o usa tu get existente
    if not fe:
        raise ValueError(f"FileEntry {file_id} no existe")

    local_txt_path = ensure_local_processed_txt(fe)
    with open(local_txt_path, "r", encoding="utf-8") as f:
        text = f.read().strip()
    if not text:
        LOGGER.warning(f"[INDEX] TXT vacío para file_id={file_id}")
        return 0

    chunks = simple_chunk(text, max_tokens=400, overlap=50)
    if not chunks:
        return 0

    vectors = _EMBEDDER.embed_passages(chunks)
    store = FaissStore(org_id=fe.organization_id, dim=_EMBEDDER.dim)

    metas = []
    for i, chunk_text in enumerate(chunks):
        meta = {
            "file_id": fe.id,
            "organization_id": fe.organization_id,
            "chunk_index": i,
            "content_preview": chunk_text[:300],
            "s3_key_processed": fe.s3_key_processed,
        }
        metas.append(meta)

    store.add(vectors, metas)

    # Persistir en SQL (opcionalmente guarda content_text para debugging)
    created = 0
    for i, meta in enumerate(metas):
        dc = DocumentChunk(
            vector_id=str(len(store.meta) - len(metas) + i),  # índice FAISS actual como string
            file_entry_id=fe.id,
            organization_id=fe.organization_id,
            content_text=chunks[i][:2000],
            metadata_json=meta,
        )
        db.add(dc)
        created += 1
    db.commit()

    LOGGER.info(f"[INDEX] file_id={file_id} -> {created} chunks")
    return created

# ---- Borrado por archivo + rebuild ----
def rebuild_org_index(db: Session, organization_id: int) -> int:
    """
    Reconstruye el índice FAISS de la organización desde los DocumentChunk vigentes (SQL).
    Úsalo después de eliminar un archivo o para reindex completo.
    """
    q = db.query(DocumentChunk).filter(DocumentChunk.organization_id == organization_id)
    rows = q.all()
    if not rows:
        store = FaissStore(org_id=organization_id, dim=_EMBEDDER.dim)
        store.rebuild(np.zeros((0, _EMBEDDER.dim), dtype="float32"), [])
        return 0

    texts = []
    metas = []
    for r in rows:
        txt = r.content_text or (r.metadata_json or {}).get("content_preview") or ""
        texts.append(txt)
        meta = r.metadata_json or {}
        metas.append(meta)

    vectors = _EMBEDDER.embed_passages(texts)
    store = FaissStore(org_id=organization_id, dim=_EMBEDDER.dim)
    store.rebuild(vectors, metas)
    return len(metas)

def delete_file_chunks(db: Session, file_id: int, organization_id: int) -> int:
    """
    Borra DocumentChunk del archivo en SQL y luego reconstruye FAISS del org.
    """
    n = db.query(DocumentChunk).filter(
        DocumentChunk.organization_id == organization_id,
        DocumentChunk.file_entry_id == file_id
    ).delete(synchronize_session=False)
    db.commit()
    cnt = rebuild_org_index(db, organization_id)
    LOGGER.info(f"[INDEX] Deleted chunks for file_id={file_id}; rebuilt org={organization_id} with {cnt} vectors")
    return n
