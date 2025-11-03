from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
from collections import defaultdict

from app.database.db import get_db
from app.dependencies.auth import get_current_user_data
from app.enums.file_status import FileStatusEnum
from app.routers.schemas.auth import UserTokenData
from app.routers.schemas.file import FileEntryResponse, FileActiveStatusUpdate
from app.services import file_service, s3_service

router = APIRouter()

@router.get("/list", response_model=Dict[str, List[FileEntryResponse]])
def list_organization_files(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    org_id = int(current_user.organization_id)
    files = file_service.get_files_by_org(db, org_id)

    grouped: Dict[str, List] = defaultdict(list)
    for f in files:
        grouped[f.status.value].append(f)  # usa el valor del Enum como clave

    # asegura las claves esperadas (evita “parpadeos” en el front)
    for key in [s.value for s in FileStatusEnum]:
        grouped.setdefault(key, [])

    return grouped

@router.patch("/{file_id}/set-active", response_model=FileEntryResponse)
def set_active(
    file_id: int,
    body: FileActiveStatusUpdate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    org_id = int(current_user.organization_id)
    file = file_service.get_file_by_id(db, file_id, org_id)
    file_service.set_active_flag(db, file, is_active=body.is_active)
    return file

@router.get("/download-url/{file_id}", response_model=dict)
def get_download_url(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    org_id = int(current_user.organization_id)
    file = file_service.get_file_by_id(db, file_id, org_id)
    if not file.s3_key_original:
        raise HTTPException(status_code=400, detail="El archivo aún no fue subido a S3.")
    url = s3_service.get_presigned_url(file.s3_key_original)
    return {"url": url}

@router.delete("/{file_id}", response_model=dict)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    org_id = int(current_user.organization_id)
    file = file_service.get_file_by_id(db, file_id, org_id)

    # 1) Borrar en S3 (si existiese)
    if file.s3_key_original:
        s3_service.delete_file_from_s3(file.s3_key_original)
    if file.s3_key_processed:
        s3_service.delete_file_from_s3(file.s3_key_processed)

    # 2) Borrar en DB (en cascada)
    file_service.delete_file_entry(db, file)

    # 3) (Futuro) eliminar vectores de tu índice RAG

    return {"message": f"Archivo {file.original_filename} eliminado."}
