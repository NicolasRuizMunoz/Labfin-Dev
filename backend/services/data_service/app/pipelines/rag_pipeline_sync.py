# app/pipelines/rag_pipeline_sync.py
import logging
from app.database.db import SessionLocal
from app.services.ingest_pipeline import process_and_upload
from app.services.index_service import index_file

LOGGER = logging.getLogger(__name__)

def run(file_id: int, local_path: str, fast_local: bool = True) -> int:
    """
    Ejecuta el pipeline completo SIN Celery:
      1) Procesa y sube (original + txt) -> estados en DB
      2) Indexa en FAISS
    Devuelve cantidad de chunks indexados.

    fast_local=True intenta evitar descargar desde S3 para indexar
    (requiere el ajuste del punto 2).
    """
    db = SessionLocal()
    try:
        # Paso 1: ingesta + subida
        process_and_upload(db, file_id=file_id, local_path=local_path, cleanup=not fast_local)
        # Paso 2: indexado FAISS
        created = index_file(db, file_id=file_id)
        LOGGER.info(f"[PIPELINE_SYNC] file_id={file_id} indexados={created}")
        return created
    except Exception as e:
        LOGGER.exception(f"[PIPELINE_SYNC] Error file_id={file_id}: {e}")
        raise
    finally:
        db.close()
