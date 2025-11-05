# app/routers/file.py
from collections import defaultdict
from typing import Dict, List, Optional
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os

from app.database.db import get_db
from app.dependencies.auth import get_current_user_data
from app.enums.file_status import FileStatusEnum
from app.routers.schemas.auth import UserTokenData
from app.routers.schemas.file import FileEntryResponse, FileActiveStatusUpdate
from app.services import file_service, s3_service
from app.tasks.file_tasks import run_rag_pipeline
from app.config import UPLOAD_DIR

router = APIRouter()

# ---- helpers fallback ----
def enqueue_or_sync(file_id: int, local_path: str) -> str:
    try:
        from app.celery_worker import celery_app
        # ¿hay broker?
        celery_app.connection().ensure_connection(max_retries=1)
        # intentar ping (opcional)
        try:
            celery_app.control.ping(timeout=0.5)
        except Exception:
            pass
        run_rag_pipeline.delay(file_id=file_id, local_path=local_path)
        return "queued"
    except Exception:
        # sin broker/worker: correr síncrono
        run_rag_pipeline.run(file_id=file_id, local_path=local_path)
        return "sync"

class ConfirmBulkRequest(BaseModel):
    file_ids: List[int]

@router.get("/list", response_model=Dict[str, List[FileEntryResponse]])
def list_organization_files(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = current_user.organization_id
    if org_id is None:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    org_id = int(org_id)

    files = file_service.get_files_by_organization(db, org_id)
    grouped: Dict[str, List[FileEntryResponse]] = defaultdict(list)
    for f in files:
        grouped[f.status.value].append(f)
    for key in [s.value for s in FileStatusEnum]:
        grouped.setdefault(key, [])
    return grouped

@router.patch("/{file_id}/set-active", response_model=FileEntryResponse)
def set_active_flag(
    file_id: int,
    body: FileActiveStatusUpdate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = current_user.organization_id
    if org_id is None:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    org_id = int(org_id)

    file_service.set_file_active_status(db, file_id=file_id, organization_id=org_id, is_active=body.is_active)
    updated = file_service.get_file_by_id(db, file_id, org_id)
    return updated

@router.get("/download-url/{file_id}", response_model=dict)
def get_download_url(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = current_user.organization_id
    if org_id is None:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    org_id = int(org_id)

    file = file_service.get_file_by_id(db, file_id, org_id)
    if not file.s3_key_original:
        raise HTTPException(status_code=400, detail="El archivo aún no fue subido a S3.")
    url = s3_service.generate_presigned_download_url(file.s3_key_original, file.original_filename)
    return {"url": url}

@router.delete("/{file_id}", response_model=dict)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = current_user.organization_id
    if org_id is None:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    org_id = int(org_id)

    file = file_service.get_file_by_id(db, file_id, org_id)
    if file.s3_key_original:
        s3_service.delete_file_from_s3(file.s3_key_original)
    if file.s3_key_processed:
        s3_service.delete_file_from_s3(file.s3_key_processed)
    file_service.delete_file_entry(db, file)
    return {"message": f"Archivo {file.original_filename} eliminado."}

@router.post("/confirm/{file_id}", response_model=dict)
def confirm_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = current_user.organization_id
    if org_id is None:
        raise HTTPException(status_code=403, detail="User does not belong a una organización")
    org_id = int(org_id)

    f = file_service.get_file_by_id(db, file_id, org_id)
    saved_name = f"{org_id}__{f.batch_id or 'no-batch'}__{f.original_filename}"
    local_path = os.path.join(UPLOAD_DIR, saved_name)
    if not os.path.exists(local_path):
        # idempotente: nada que hacer si ya se procesó/limpió
        return {"message": "No-op: archivo local no está disponible", "file_id": f.id}

    mode = enqueue_or_sync(f.id, local_path)
    return {"message": f"Procesamiento lanzado ({mode})", "file_id": f.id}

@router.post("/confirm/bulk", response_model=dict)
def confirm_files_bulk(
    body: ConfirmBulkRequest,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = current_user.organization_id
    if org_id is None:
        raise HTTPException(status_code=403, detail="User does not belong a una organización")
    org_id = int(org_id)

    enqueued = 0
    errors = []
    for fid in body.file_ids:
        try:
            f = file_service.get_file_by_id(db, fid, org_id)
            saved_name = f"{org_id}__{f.batch_id or 'no-batch'}__{f.original_filename}"
            local_path = os.path.join(UPLOAD_DIR, saved_name)
            if not os.path.exists(local_path):
                # idempotencia: si ya no existe, no es error
                continue
            enqueue_or_sync(f.id, local_path)
            enqueued += 1
        except HTTPException as e:
            errors.append({"file_id": fid, "error": e.detail})
        except Exception as e:
            errors.append({"file_id": fid, "error": str(e)})
    return {"enqueued": enqueued, "errors": errors}
