# app/routers/batch.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

# --- Importaciones Corregidas ---
from app.database.db import get_db
from app.dependencies.auth import get_current_user_data
from app.routers.schemas.auth import UserTokenData
from app.routers.schemas.file_batch import ( 
    FileBatchResponse, 
    FileBatchWithFilesResponse,
    FileBatchCreate
)
from app.services import file_batch_service

router = APIRouter()

@router.post("/", response_model=FileBatchResponse)
def create_new_batch(
    payload: FileBatchCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    """Crea un nuevo FileBatch (lote de archivos) vacío."""
    org_id = int(current_user.organization_id)
    batch = file_batch_service.create_file_batch(
        organization_id=org_id,
        name=payload.name,
        db=db
    )
    return batch

@router.get("/list", response_model=List[FileBatchWithFilesResponse])
def list_organization_batches(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    """Lista todos los batches de la organización y los archivos dentro de ellos."""
    org_id = int(current_user.organization_id)
    return file_batch_service.get_batches_with_files(
        organization_id=org_id, 
        db=db
    )

@router.delete("/{batch_id}", response_model=dict)
def delete_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    """
    Elimina un batch. 
    TODO: Implementar la eliminación de archivos y vectores asociados.
    """
    org_id = int(current_user.organization_id)
    batch = file_batch_service.get_batch_by_id_and_org(db, batch_id, org_id)

    # Lógica de seguridad (no borrar si tiene archivos)
    if batch.files:
        raise HTTPException(status_code=400, detail="No se puede eliminar un batch con archivos.")

    file_batch_service.delete_batch(db, batch)
    return {"message": "Batch eliminado"}