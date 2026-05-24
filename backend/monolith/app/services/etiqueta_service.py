from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.etiqueta_busqueda import EtiquetaBusqueda
from app.schemas.etiqueta_busqueda import EtiquetaBusquedaCreate, EtiquetaBusquedaUpdate


def get_all(db: Session, org_id: int) -> List[EtiquetaBusqueda]:
    return (
        db.query(EtiquetaBusqueda)
        .filter(EtiquetaBusqueda.organization_id == org_id)
        .order_by(EtiquetaBusqueda.created_at.desc())
        .all()
    )


def get_one(db: Session, org_id: int, etiqueta_id: int) -> EtiquetaBusqueda:
    e = (
        db.query(EtiquetaBusqueda)
        .filter(
            EtiquetaBusqueda.id == etiqueta_id,
            EtiquetaBusqueda.organization_id == org_id,
        )
        .first()
    )
    if not e:
        raise HTTPException(404, "Etiqueta no encontrada")
    return e


def create(db: Session, org_id: int, data: EtiquetaBusquedaCreate) -> EtiquetaBusqueda:
    e = EtiquetaBusqueda(
        organization_id=org_id,
        nombre=data.nombre,
        keywords=data.keywords,
        regiones=data.regiones,
        categorias=data.categorias,
        monto_min=data.monto_min,
        monto_max=data.monto_max,
        activa=data.activa,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


def update(db: Session, org_id: int, etiqueta_id: int, data: EtiquetaBusquedaUpdate) -> EtiquetaBusqueda:
    e = get_one(db, org_id, etiqueta_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(e, field, value)
    db.commit()
    db.refresh(e)
    return e


def delete(db: Session, org_id: int, etiqueta_id: int) -> None:
    e = get_one(db, org_id, etiqueta_id)
    db.delete(e)
    db.commit()
