from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import UserTokenData, get_current_user
from app.schemas.etiqueta_busqueda import (
    EtiquetaBusquedaCreate,
    EtiquetaBusquedaResponse,
    EtiquetaBusquedaUpdate,
    ScrapeRunResponse,
)
from app.services import etiqueta_service, mercadopublico_service

router = APIRouter(prefix="/etiquetas", tags=["Etiquetas búsqueda"])


def _require_org(current_user: UserTokenData) -> int:
    if current_user.organization_id is None:
        raise HTTPException(status_code=403, detail="El usuario no pertenece a ninguna organización")
    return int(current_user.organization_id)


@router.get("/", response_model=List[EtiquetaBusquedaResponse])
def list_etiquetas(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return etiqueta_service.get_all(db, _require_org(current_user))


@router.post("/", response_model=EtiquetaBusquedaResponse, status_code=status.HTTP_201_CREATED)
def create_etiqueta(
    data: EtiquetaBusquedaCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return etiqueta_service.create(db, _require_org(current_user), data)


@router.patch("/{etiqueta_id}", response_model=EtiquetaBusquedaResponse)
def update_etiqueta(
    etiqueta_id: int,
    data: EtiquetaBusquedaUpdate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return etiqueta_service.update(db, _require_org(current_user), etiqueta_id, data)


@router.delete("/{etiqueta_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_etiqueta(
    etiqueta_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    etiqueta_service.delete(db, _require_org(current_user), etiqueta_id)


@router.post("/scrape/run", response_model=ScrapeRunResponse)
def run_scrape_now(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    """Trigger an immediate MercadoPúblico sync for the caller's organization."""
    result = mercadopublico_service.sincronizar_para_org(db, _require_org(current_user))
    return ScrapeRunResponse(**result)
