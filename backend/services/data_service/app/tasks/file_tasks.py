# app/tasks/file_tasks.py
from app.celery_worker import celery_app
from sqlalchemy.orm import Session
from app.database.db import SessionLocal
from app.services.ingest_pipeline import process_and_upload
from app.services import file_service
from app.enums.file_status import FileStatusEnum
import time, traceback

def _log(step: str, **ctx):
    print(f"[RAG-PIPELINE] {step} :: {ctx}")

@celery_app.task
def run_rag_pipeline(file_id: int, local_path: str):
    t0 = time.time()
    db: Session = SessionLocal()
    try:
        _log("INIT", file_id=file_id, local_path=local_path)
        process_and_upload(db, file_id, local_path)
        _log("DONE", file_id=file_id, elapsed=f"{time.time()-t0:.2f}s")
    except Exception as e:
        _log("ERROR", file_id=file_id, error=str(e), trace=traceback.format_exc())
        try:
            file_service.update_file_status(db, file_id, FileStatusEnum.FAILED)
        except Exception:
            pass
    finally:
        try:
            db.close()
        except Exception:
            pass
