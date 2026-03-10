import logging
import os
from collections import defaultdict
from typing import Dict, List

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Request
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR
from app.database.db import get_db
from app.dependencies.auth import get_current_user, UserTokenData
from app.enums.file_status import FileStatusEnum
from app.schemas.file import FileActiveStatusUpdate, FileEntryResponse, FileIdsRequest
from app.services import file_service, index_service, s3_service
from app.services.ingest_pipeline import process_and_upload
from app.database.db import SessionLocal

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/file", tags=["File"])


def _require_org(current_user: UserTokenData) -> int:
    if current_user.organization_id is None:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    return int(current_user.organization_id)


def _run_pipeline(file_id: int, local_path: str) -> int:
    db = SessionLocal()
    try:
        process_and_upload(db, file_id=file_id, local_path=local_path, cleanup=False)
        return index_service.index_file(db, file_id=file_id)
    finally:
        db.close()


@router.get("/list", response_model=Dict[str, List[FileEntryResponse]])
def list_files(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    files = file_service.get_files_by_organization(db, org_id)
    grouped: Dict[str, List[FileEntryResponse]] = defaultdict(list)
    for f in files:
        grouped[f.status.value].append(f)
    for key in [s.value for s in FileStatusEnum]:
        grouped.setdefault(key, [])
    return grouped


@router.patch("/{file_id}/set-active", response_model=FileEntryResponse)
def set_active(
    file_id: int,
    body: FileActiveStatusUpdate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    file_service.set_file_active_status(db, file_id=file_id, organization_id=org_id, is_active=body.is_active)
    return file_service.get_file_by_id(db, file_id, org_id)


@router.get("/download-url/{file_id}", response_model=dict)
def download_url(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    file = file_service.get_file_by_id(db, file_id, org_id)
    if not file.s3_key_original:
        raise HTTPException(status_code=400, detail="File not yet uploaded to S3.")
    url = s3_service.generate_presigned_download_url(file.s3_key_original, file.original_filename)
    return {"url": url}


@router.delete("/{file_id}", response_model=dict)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    file = file_service.get_file_by_id(db, file_id, org_id)
    if file.s3_key_original:
        s3_service.delete_file_from_s3(file.s3_key_original)
    if file.s3_key_processed:
        s3_service.delete_file_from_s3(file.s3_key_processed)
    index_service.delete_file_chunks(db, file_id=file_id, organization_id=org_id)
    file_service.delete_file_entry(db, file)
    return {"message": f"File {file.original_filename} deleted."}


@router.post("/confirm/{file_id}", response_model=dict)
def confirm_file(
    file_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    f = file_service.get_file_by_id(db, file_id, org_id)
    saved_name = f"{org_id}__{f.batch_id or 'no-batch'}__{f.original_filename}"
    local_path = os.path.join(UPLOAD_DIR, saved_name)
    if not os.path.exists(local_path):
        return {"message": "No-op: local file not available", "file_id": f.id}
    n = _run_pipeline(f.id, local_path)
    return {"message": "Processing + indexing complete", "indexed_chunks": n, "file_id": f.id}


@router.post("/confirm/bulk", response_model=dict)
async def confirm_bulk(
    request: Request,
    body: FileIdsRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    processed, indexed_total, errors = 0, 0, []

    for fid in body.file_ids:
        try:
            f = file_service.get_file_by_id(db, fid, org_id)
            saved_name = f"{org_id}__{f.batch_id or 'no-batch'}__{f.original_filename}"
            local_path = os.path.join(UPLOAD_DIR, saved_name)
            if not os.path.exists(local_path):
                errors.append({"file_id": fid, "error": "Local file not available"})
                continue
            n = _run_pipeline(f.id, local_path)
            processed += 1
            indexed_total += int(n)
        except HTTPException as e:
            errors.append({"file_id": fid, "error": e.detail})
        except Exception as e:
            errors.append({"file_id": fid, "error": str(e)})

    return {"processed": processed, "indexed_chunks": indexed_total, "errors": errors}
