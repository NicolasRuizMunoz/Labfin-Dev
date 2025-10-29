from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
from collections import defaultdict

from app.database.db import get_db
from app.dependencies.auth import get_current_user_data
from app.enums.file_status import FileStatusEnum
from app.routers.schemas import UserTokenData
from app.routers.schemas.file import FileEntryResponse, FileActiveStatusUpdate
from app.services import file_service, s3_service # <- Importamos los servicios

router = APIRouter()

@router.get("/list", response_model=Dict[str, List[FileEntryResponse]])
def list_organization_files(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    """
    Lista todos los archivos de la organización (excluyendo los fallidos)
    agrupados por categoría.
    """
    org_id = int(current_user.organization_id)
    files = file_service.get_files_by_organization(db, org_id)

    # Agrupar por categoría como lo tenías
    grouped = defaultdict(list)
    for f in files:
        key = f.file_category or "Otros"
        grouped[key].append(f)
        
    return grouped


@router.patch("/{file_id}/set-active", response_model=FileEntryResponse)
def set_file_active_status(
    file_id: int,
    payload: FileActiveStatusUpdate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    """
    Activa o desactiva un archivo para que sea (o no) usado por el RAG.
    """
    org_id = int(current_user.organization_id)
    
    file = file_service.set_file_active_status(
        db=db,
        file_id=file_id,
        organization_id=org_id,
        is_active=payload.is_active
    )
    
    # Aquí podrías disparar una tarea de Celery si necesitas
    # (re)indexar o des-indexar de OpenSearch, pero por ahora
    # el filtro se hará en la búsqueda.
    
    return file


@router.get("/download-url/{file_id}", response_model=dict)
def generate_download_url(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    """
    Genera una URL firmada de S3 para descargar el archivo original.
    """
    org_id = int(current_user.organization_id)
    file = file_service.get_file_by_id(db, file_id, org_id)

    if not file.s3_key_original:
        raise HTTPException(status_code=400, detail="El archivo no tiene clave S3")

    url = s3_service.generate_presigned_download_url(
        file.s3_key_original, 
        file.original_filename
    )
    
    if not url:
        raise HTTPException(status_code=500, detail="Error al generar URL")

    return {"url": url}


@router.delete("/{file_id}", response_model=dict)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    """
    Elimina un archivo de la base de datos y de S3.
    TODO: Disparar tarea de Celery para eliminar vectores de OpenSearch.
    """
    org_id = int(current_user.organization_id)
    file = file_service.get_file_by_id(db, file_id, org_id)

    # 1. Eliminar de S3
    s3_service.delete_file_from_s3(file.s3_key_original)
    s3_service.delete_file_from_s3(file.s3_key_processed)

    # 2. Eliminar de la Base de Datos
    # (Esto borrará en cascada los DocumentChunks asociados)
    file_service.delete_file_entry(db, file)

    # 3. PENDIENTE: Tarea de Celery para eliminar de OpenSearch
    # delete_vectors_from_opensearch.delay(file_id=file_id)

    return {"message": f"Archivo {file.original_filename} eliminado."}