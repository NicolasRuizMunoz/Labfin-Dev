from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import get_current_user, UserTokenData
from app.schemas.licitacion import LicitacionCreate, LicitacionUpdate, LicitacionResponse
from app.schemas.file import FileEntryResponse
from app.services import licitacion_service, file_service

router = APIRouter(prefix="/licitacion", tags=["Licitaciones"])


@router.post("/", response_model=LicitacionResponse, status_code=status.HTTP_201_CREATED)
def create_licitacion(
    data: LicitacionCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return licitacion_service.create(db, current_user.organization_id, data)


@router.get("/", response_model=List[LicitacionResponse])
def list_licitaciones(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return licitacion_service.get_all(db, current_user.organization_id)


@router.get("/{lic_id}", response_model=LicitacionResponse)
def get_licitacion(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return licitacion_service.get_one(db, current_user.organization_id, lic_id)


@router.get("/{lic_id}/files", response_model=List[FileEntryResponse])
def list_licitacion_files(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    if current_user.organization_id is None:
        raise HTTPException(status_code=403, detail="El usuario no pertenece a ninguna organización")
    org_id = int(current_user.organization_id)
    licitacion_service.get_one(db, org_id, lic_id)  # valida que la licitación pertenece a la org
    return file_service.get_files_by_licitacion(db, org_id, lic_id)


@router.patch("/{lic_id}", response_model=LicitacionResponse)
def update_licitacion(
    lic_id: int,
    data: LicitacionUpdate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return licitacion_service.update(db, current_user.organization_id, lic_id, data)


@router.delete("/{lic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_licitacion(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    licitacion_service.delete(db, current_user.organization_id, lic_id)
