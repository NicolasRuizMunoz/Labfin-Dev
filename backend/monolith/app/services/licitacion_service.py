from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException

from app.models.licitacion import Licitacion
from app.schemas.licitacion import LicitacionCreate, LicitacionUpdate


def create(db: Session, org_id: int, data: LicitacionCreate) -> Licitacion:
    lic = Licitacion(
        organization_id=org_id,
        nombre=data.nombre,
        fecha_vencimiento=data.fecha_vencimiento,
    )
    db.add(lic)
    db.commit()
    db.refresh(lic)
    return lic


def get_all(db: Session, org_id: int) -> List[Licitacion]:
    return (
        db.query(Licitacion)
        .options(joinedload(Licitacion.files))
        .filter(Licitacion.organization_id == org_id)
        .all()
    )


def get_one(db: Session, org_id: int, lic_id: int) -> Licitacion:
    lic = (
        db.query(Licitacion)
        .options(joinedload(Licitacion.files))
        .filter(Licitacion.id == lic_id, Licitacion.organization_id == org_id)
        .first()
    )
    if not lic:
        raise HTTPException(status_code=404, detail="Licitación no encontrada")
    return lic


def update(db: Session, org_id: int, lic_id: int, data: LicitacionUpdate) -> Licitacion:
    lic = get_one(db, org_id, lic_id)
    if data.nombre is not None:
        lic.nombre = data.nombre
    if data.fecha_vencimiento is not None:
        lic.fecha_vencimiento = data.fecha_vencimiento
    db.commit()
    db.refresh(lic)
    return lic


def delete(db: Session, org_id: int, lic_id: int) -> None:
    lic = get_one(db, org_id, lic_id)
    db.delete(lic)
    db.commit()