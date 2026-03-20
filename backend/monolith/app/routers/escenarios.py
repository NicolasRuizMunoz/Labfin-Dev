from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import get_current_user, UserTokenData
from app.schemas.escenario import EscenarioCreate, EscenarioUpdate, EscenarioOut
from app.services import escenario_service

router = APIRouter(prefix="/escenarios", tags=["Escenarios"])


def _require_org(current_user: UserTokenData) -> int:
    if current_user.organization_id is None:
        raise HTTPException(status_code=403, detail="El usuario no pertenece a ninguna organización")
    return int(current_user.organization_id)


def _to_out(db: Session, esc) -> dict:
    """Build EscenarioOut-compatible dict with simulaciones_count."""
    data = {
        "id": esc.id,
        "nombre": esc.nombre,
        "descripcion": esc.descripcion,
        "tipo": esc.tipo,
        "parametros": esc.parametros,
        "is_active": esc.is_active,
        "created_by": esc.created_by,
        "created_at": esc.created_at,
        "updated_at": esc.updated_at,
        "simulaciones_count": escenario_service.count_simulaciones(db, esc.id),
    }
    return data


@router.post("/", response_model=EscenarioOut, status_code=status.HTTP_201_CREATED)
def create_escenario(
    data: EscenarioCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    esc = escenario_service.create(db, org_id, current_user.user_id, data)
    return _to_out(db, esc)


@router.get("/", response_model=List[EscenarioOut])
def list_escenarios(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    escenarios = escenario_service.get_all(db, org_id)
    return [_to_out(db, e) for e in escenarios]


@router.get("/{escenario_id}", response_model=EscenarioOut)
def get_escenario(
    escenario_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    esc = escenario_service.get_one(db, org_id, escenario_id)
    return _to_out(db, esc)


@router.patch("/{escenario_id}", response_model=EscenarioOut)
def update_escenario(
    escenario_id: int,
    data: EscenarioUpdate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    esc = escenario_service.update(db, org_id, escenario_id, data)
    return _to_out(db, esc)


@router.delete("/{escenario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_escenario(
    escenario_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    escenario_service.delete(db, org_id, escenario_id)
