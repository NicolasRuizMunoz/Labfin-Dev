from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import get_current_user, UserTokenData
from app.schemas.simulacion import SimulacionCreate, SimulacionUpdate, SimulacionOut, AnalisisSimulacionOut
from app.schemas.escenario import EscenarioOut
from app.services import simulacion_service, licitacion_service, escenario_service

router = APIRouter(prefix="/licitacion", tags=["Simulaciones"])


def _require_org(current_user: UserTokenData) -> int:
    if current_user.organization_id is None:
        raise HTTPException(status_code=403, detail="El usuario no pertenece a ninguna organización")
    return int(current_user.organization_id)


def _sim_to_out(db: Session, sim) -> dict:
    """Build SimulacionOut-compatible dict."""
    escenarios = []
    for se in sim.simulacion_escenarios:
        esc = se.escenario
        escenarios.append({
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
        })

    ultimo = sim.analisis[0] if sim.analisis else None

    return {
        "id": sim.id,
        "nombre": sim.nombre,
        "color": sim.color,
        "is_active": sim.is_active,
        "escenarios": escenarios,
        "ultimo_analisis": {
            "id": ultimo.id,
            "analisis": ultimo.analisis,
            "model": ultimo.model,
            "tokens_usados": ultimo.tokens_usados,
            "curva_data": ultimo.curva_data,
            "created_at": ultimo.created_at,
        } if ultimo else None,
        "created_at": sim.created_at,
    }


@router.post("/{lic_id}/simulaciones", response_model=SimulacionOut, status_code=status.HTTP_201_CREATED)
def create_simulacion(
    lic_id: int,
    data: SimulacionCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    licitacion_service.get_one(db, org_id, lic_id)
    sim = simulacion_service.create(db, org_id, current_user.user_id, lic_id, data)
    return _sim_to_out(db, sim)


@router.get("/{lic_id}/simulaciones", response_model=List[SimulacionOut])
def list_simulaciones(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    licitacion_service.get_one(db, org_id, lic_id)
    sims = simulacion_service.get_all_for_licitacion(db, org_id, lic_id)
    return [_sim_to_out(db, s) for s in sims]


@router.patch("/{lic_id}/simulaciones/{sim_id}", response_model=SimulacionOut)
def update_simulacion(
    lic_id: int,
    sim_id: int,
    data: SimulacionUpdate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    licitacion_service.get_one(db, org_id, lic_id)
    sim = simulacion_service.update(db, org_id, lic_id, sim_id, data)
    return _sim_to_out(db, sim)


@router.delete("/{lic_id}/simulaciones/{sim_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_simulacion(
    lic_id: int,
    sim_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    simulacion_service.delete(db, org_id, lic_id, sim_id)


@router.patch("/{lic_id}/simulaciones/{sim_id}/toggle", response_model=SimulacionOut)
def toggle_simulacion(
    lic_id: int,
    sim_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    sim = simulacion_service.toggle_active(db, org_id, lic_id, sim_id)
    return _sim_to_out(db, sim)


@router.post("/{lic_id}/simulaciones/{sim_id}/analizar", response_model=AnalisisSimulacionOut)
def analizar_simulacion(
    lic_id: int,
    sim_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    return simulacion_service.analyze_simulacion(db, org_id, lic_id, sim_id, user_id=current_user.user_id)


@router.get("/{lic_id}/simulaciones/{sim_id}/analisis", response_model=List[AnalisisSimulacionOut])
def get_analisis_history(
    lic_id: int,
    sim_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    return simulacion_service.get_analisis_history(db, org_id, lic_id, sim_id)
