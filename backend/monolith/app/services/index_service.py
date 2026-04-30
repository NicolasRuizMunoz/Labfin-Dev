import os
import logging
from typing import List

from sqlalchemy.orm import Session

from app.services import file_service, s3_service
from app.models.document_chunk import DocumentChunk
from app.config import PROCESSED_DIR

LOGGER = logging.getLogger(__name__)


def simple_chunk(text: str, max_tokens: int = 400, overlap: int = 50) -> List[str]:
    words = text.split()
    chunks, i, step = [], 0, max_tokens - overlap
    while i < len(words):
        chunks.append(" ".join(words[i: i + max_tokens]))
        i += step
    return chunks


def _ensure_local_txt(fe) -> str:
    base = f"{fe.organization_id}__{fe.original_filename}"
    txt_name = os.path.splitext(base)[0] + ".txt"
    local_txt = os.path.join(PROCESSED_DIR, txt_name)
    if os.path.exists(local_txt):
        return local_txt
    if not fe.s3_key_processed:
        raise FileNotFoundError("No s3_key_processed for this file")
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    out_path = os.path.join(PROCESSED_DIR, os.path.basename(fe.s3_key_processed).split("/")[-1])
    if not s3_service.download_file(fe.s3_key_processed, out_path):
        raise IOError(f"Could not download {fe.s3_key_processed} from S3")
    return out_path


def index_file(db: Session, file_id: int) -> int:
    """Chunk a file and persist its chunks in DocumentChunk.

    No embeddings or FAISS — el análisis EVA y el chat de licitación
    leen content_text directamente desde MySQL.
    """
    fe = file_service.get_file_by_id_raw(db, file_id)
    if not fe:
        raise ValueError(f"FileEntry {file_id} not found")

    local_txt = _ensure_local_txt(fe)
    with open(local_txt, "r", encoding="utf-8") as f:
        text = f.read().strip()
    if not text:
        LOGGER.warning(f"[INDEX] Empty text for file_id={file_id}")
        return 0

    chunks = simple_chunk(text)
    if not chunks:
        return 0

    for i, chunk in enumerate(chunks):
        meta = {
            "file_id": fe.id,
            "organization_id": fe.organization_id,
            "chunk_index": i,
            "content_preview": chunk[:300],
            "s3_key_processed": fe.s3_key_processed,
        }
        dc = DocumentChunk(
            vector_id=f"{fe.id}:{i}",
            file_entry_id=fe.id,
            organization_id=fe.organization_id,
            content_text=chunk[:2000],
            metadata_json=meta,
        )
        db.add(dc)
    db.commit()

    LOGGER.info(f"[INDEX] file_id={file_id} -> {len(chunks)} chunks (no embeddings)")
    return len(chunks)


def rebuild_org_index(db: Session, organization_id: int) -> int:
    """No-op — los embeddings y FAISS están desactivados."""
    LOGGER.info(f"[INDEX] rebuild_org_index({organization_id}) skipped — embeddings disabled")
    return 0


def delete_file_chunks(db: Session, file_id: int, organization_id: int) -> int:
    n = db.query(DocumentChunk).filter(
        DocumentChunk.organization_id == organization_id,
        DocumentChunk.file_entry_id == file_id,
    ).delete(synchronize_session=False)
    db.commit()
    LOGGER.info(f"[INDEX] Deleted {n} chunks for file_id={file_id}")
    return n
