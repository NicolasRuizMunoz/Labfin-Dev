from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import get_current_user, UserTokenData
from app.schemas.file_batch import FileBatchCreate, FileBatchResponse, FileBatchWithFilesResponse
from app.services import file_batch_service

router = APIRouter(prefix="/batch", tags=["Batch"])


def _require_org(current_user: UserTokenData) -> int:
    if current_user.organization_id is None:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    return int(current_user.organization_id)


@router.post("/", response_model=FileBatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(
    payload: FileBatchCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return file_batch_service.create_file_batch(db=db, organization_id=_require_org(current_user), name=payload.name)


@router.get("/list", response_model=List[FileBatchWithFilesResponse])
def list_batches(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return file_batch_service.get_batches_with_files(_require_org(current_user), db)


@router.delete("/{batch_id}", response_model=dict)
def delete_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    batch = file_batch_service.get_batch_by_id_and_org(db, batch_id, _require_org(current_user))
    if batch.files:
        raise HTTPException(status_code=400, detail="Cannot delete a batch that has files.")
    file_batch_service.delete_batch(db, batch)
    return {"message": "Batch deleted"}
