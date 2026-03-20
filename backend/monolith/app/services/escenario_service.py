from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.escenario import Escenario
from app.models.simulacion import SimulacionEscenario
from app.schemas.escenario import EscenarioCreate, EscenarioUpdate


def count_simulaciones(db: Session, escenario_id: int) -> int:
    return (
        db.query(func.count(SimulacionEscenario.id))
        .filter(SimulacionEscenario.escenario_id == escenario_id)
        .scalar()
    ) or 0


def create(db: Session, org_id: int, user_id: int, data: EscenarioCreate) -> Escenario:
    esc = Escenario(
        organization_id=org_id,
        nombre=data.nombre,
        descripcion=data.descripcion,
        tipo=data.tipo,
        parametros=data.parametros,
        is_active=True,
        created_by=user_id,
    )
    db.add(esc)
    db.commit()
    db.refresh(esc)
    return esc


def get_all(db: Session, org_id: int) -> List[Escenario]:
    return (
        db.query(Escenario)
        .filter(Escenario.organization_id == org_id)
        .order_by(Escenario.created_at.desc())
        .all()
    )


def get_one(db: Session, org_id: int, escenario_id: int) -> Escenario:
    esc = (
        db.query(Escenario)
        .filter(Escenario.id == escenario_id, Escenario.organization_id == org_id)
        .first()
    )
    if not esc:
        raise HTTPException(status_code=404, detail="Escenario no encontrado")
    return esc


def update(db: Session, org_id: int, escenario_id: int, data: EscenarioUpdate) -> Escenario:
    esc = get_one(db, org_id, escenario_id)
    if data.nombre is not None:
        esc.nombre = data.nombre
    if data.descripcion is not None:
        esc.descripcion = data.descripcion
    if data.tipo is not None:
        esc.tipo = data.tipo
    if data.parametros is not None:
        esc.parametros = data.parametros
    db.commit()
    db.refresh(esc)
    return esc


def delete(db: Session, org_id: int, escenario_id: int) -> None:
    esc = get_one(db, org_id, escenario_id)
    refs = count_simulaciones(db, escenario_id)
    if refs > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Escenario en uso en {refs} simulacion(es). Remuévelo de las simulaciones primero.",
        )
    db.delete(esc)
    db.commit()
