# app/routers/file.py
from collections import defaultdict
from typing import Dict, List
import os
import logging

from fastapi import APIRouter, Depends, HTTPException, Body, Request, Path
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import get_current_user_data
from app.enums.file_status import FileStatusEnum
from app.routers.schemas.auth import UserTokenData
from app.routers.schemas.file import FileEntryResponse, FileActiveStatusUpdate, FileIdsRequest
from app.services import file_service, s3_service, index_service
from app.config import UPLOAD_DIR

# ✅ Runner síncrono del pipeline (ingesta + indexación FAISS)
from app.pipelines.rag_pipeline_sync import run as run_rag_pipeline_sync

logger = logging.getLogger(__name__)
router = APIRouter()


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
    # asegurar claves para todos los estados
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
    index_service.delete_file_chunks(db, file_id=file_id, organization_id=org_id)
    file_service.delete_file_entry(db, file)
    return {"message": f"Archivo {file.original_filename} eliminado."}


def run_sync(file_id: int, local_path: str, fast_local: bool = True) -> int:
    """
    Ejecuta TODO síncrono: ingesta (PDF->TXT + S3 + estados) + indexación FAISS.
    Devuelve cantidad de chunks indexados.
    """
    created = run_rag_pipeline_sync(file_id=file_id, local_path=local_path, fast_local=fast_local)
    logger.info(f"[ROUTER] file_id={file_id} indexed_chunks={created}")
    return created


@router.post("/confirm/bulk", response_model=dict)
async def confirm_files_bulk(
    request: Request,
    body: FileIdsRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = current_user.organization_id
    if org_id is None:
        raise HTTPException(status_code=403, detail="User does not belong a una organización")
    org_id = int(org_id)

    processed = 0
    indexed_total = 0
    errors: list[dict] = []

    for fid in body.file_ids:
        try:
            f = file_service.get_file_by_id(db, fid, org_id)
            saved_name = f"{org_id}__{f.batch_id or 'no-batch'}__{f.original_filename}"
            local_path = os.path.join(UPLOAD_DIR, saved_name)
            if not os.path.exists(local_path):
                errors.append({"file_id": fid, "error": "No-op: archivo local no está disponible"})
                continue

                # Nota: Si más adelante almacenas los subidos en otro path local,
                # ajusta aquí la ruta de local_path.

            n = run_sync(f.id, local_path, fast_local=True)
            processed += 1
            indexed_total += int(n)
        except HTTPException as e:
            errors.append({"file_id": fid, "error": e.detail})
        except Exception as e:
            errors.append({"file_id": fid, "error": str(e)})

    return {"processed": processed, "indexed_chunks": indexed_total, "errors": errors}


@router.post("/confirm/{file_id}", response_model=dict)
def confirm_file(
    file_id: int = Path(..., ge=1, description="ID numérico del archivo (>= 1)"),
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
        return {"message": "No-op: archivo local no está disponible", "file_id": f.id}

    n = run_sync(f.id, local_path, fast_local=True)
    return {"message": f"Procesamiento + indexación completados", "indexed_chunks": n, "file_id": f.id}
