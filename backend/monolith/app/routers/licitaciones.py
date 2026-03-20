from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import get_current_user, UserTokenData
from app.schemas.licitacion import LicitacionCreate, LicitacionUpdate, LicitacionResponse
from app.schemas.file import FileEntryResponse
from app.schemas.analisis_licitacion import AnalisisLicitacionResponse
from app.services import licitacion_service, file_service, analysis_service

router = APIRouter(prefix="/licitacion", tags=["Licitaciones"])


def _require_org(current_user: UserTokenData) -> int:
    if current_user.organization_id is None:
        raise HTTPException(status_code=403, detail="El usuario no pertenece a ninguna organización")
    return int(current_user.organization_id)


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
    org_id = _require_org(current_user)
    licitacion_service.get_one(db, org_id, lic_id)
    return file_service.get_files_by_licitacion(db, org_id, lic_id)


@router.get("/{lic_id}/analisis", response_model=List[AnalisisLicitacionResponse])
def get_analisis_history(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    licitacion_service.get_one(db, org_id, lic_id)
    return analysis_service.get_analisis_history(db, org_id, lic_id)


@router.post("/{lic_id}/analizar", response_model=dict)
def analizar_licitacion(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    return analysis_service.analyze_licitacion(db, org_id, lic_id, user_id=current_user.user_id)


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
