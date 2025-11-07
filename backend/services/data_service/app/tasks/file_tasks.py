# app/tasks/file_tasks.py
import logging
from app.database.db import SessionLocal
from app.services.ingest_pipeline import process_and_upload
from app.services.index_service import index_file

LOGGER = logging.getLogger(__name__)

def run_rag_pipeline(file_id: int, local_path: str):
    """
    1) Procesa y sube (original + txt)
    2) Indexa en FAISS
    """
    db = SessionLocal()
    try:
        process_and_upload(db, file_id=file_id, local_path=local_path)
        created = index_file(db, file_id=file_id)
        LOGGER.info(f"[PIPELINE] file_id={file_id} indexados={created}")
    except Exception as e:
        LOGGER.exception(f"[PIPELINE] Error en run_rag_pipeline file_id={file_id}: {e}")
        raise
    finally:
        db.close()

# Celery wrapper opcional:
try:
    from app.celery_worker import celery_app

    @celery_app.task(name="run_rag_pipeline")
    def run_rag_pipeline_task(file_id: int, local_path: str):
        run_rag_pipeline(file_id, local_path)
except Exception:
    # modo síncrono: usas run_rag_pipeline.run en tu router
    pass
