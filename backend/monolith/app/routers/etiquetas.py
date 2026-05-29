from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import UserTokenData, get_current_user, require_org
from app.schemas.etiqueta_busqueda import (
    DescubrirRunResponse,
    EtiquetaBusquedaCreate,
    EtiquetaBusquedaResponse,
    EtiquetaBusquedaUpdate,
    ScrapeRunResponse,
)
from app.services import etiqueta_service, mercadopublico_service

router = APIRouter(prefix="/etiquetas", tags=["Etiquetas búsqueda"])



@router.get("/", response_model=List[EtiquetaBusquedaResponse])
def list_etiquetas(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return etiqueta_service.get_all(db, require_org(current_user))


@router.post("/", response_model=EtiquetaBusquedaResponse, status_code=status.HTTP_201_CREATED)
def create_etiqueta(
    data: EtiquetaBusquedaCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return etiqueta_service.create(db, require_org(current_user), data)


@router.patch("/{etiqueta_id}", response_model=EtiquetaBusquedaResponse)
def update_etiqueta(
    etiqueta_id: int,
    data: EtiquetaBusquedaUpdate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return etiqueta_service.update(db, require_org(current_user), etiqueta_id, data)


@router.delete("/{etiqueta_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_etiqueta(
    etiqueta_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    etiqueta_service.delete(db, require_org(current_user), etiqueta_id)


@router.post("/scrape/run", response_model=ScrapeRunResponse)
def run_scrape_now(
    dias: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    """Modo targeted: sincroniza con detalle las licitaciones que matchean las
    etiquetas activas, en una ventana de `dias` (default = MP_DESCUBRIR_DIAS)."""
    result = mercadopublico_service.sincronizar_para_org(
        db, require_org(current_user), dias_atras=dias
    )
    return ScrapeRunResponse(**result)


@router.post("/descubrir", response_model=DescubrirRunResponse)
def run_descubrir(
    dias: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    """Modo descubrimiento: trae TODAS las publicadas que cierran dentro de la
    ventana (datos livianos del listado; el detalle se baja al abrir cada una)."""
    result = mercadopublico_service.descubrir_para_org(
        db, require_org(current_user), dias_atras=dias
    )
    return DescubrirRunResponse(**result)
