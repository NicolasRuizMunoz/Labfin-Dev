from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import get_current_user_data
from app.routers.schemas.auth import UserTokenData
from app.routers.schemas.file_batch import (
    FileBatchResponse,
    FileBatchWithFilesResponse,
    FileBatchCreate,
)
from app.services import file_batch_service

router = APIRouter()

@router.post("/", response_model=FileBatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(
    payload: FileBatchCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = current_user.organization_id
    if org_id is None:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    org_id = int(org_id)

    batch = file_batch_service.create_file_batch(
        organization_id=org_id,
        name=payload.name,
        db=db,
    )
    return batch


@router.get("/list", response_model=List[FileBatchWithFilesResponse])
def list_batches(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = current_user.organization_id
    if org_id is None:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    org_id = int(org_id)

    return file_batch_service.get_batches_with_files(org_id, db)


@router.delete("/{batch_id}", response_model=dict)
def delete_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = current_user.organization_id
    if org_id is None:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    org_id = int(org_id)

    batch = file_batch_service.get_batch_by_id_and_org(db, batch_id, org_id)

    if batch.files:
        raise HTTPException(status_code=400, detail="No se puede eliminar un batch con archivos.")

    file_batch_service.delete_batch(db, batch)
    return {"message": "Batch eliminado"}
