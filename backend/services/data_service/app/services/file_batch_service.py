# app/services/file_batch_service.py
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from typing import List
from fastapi import HTTPException

# --- Importaciones Corregidas ---
from app.models.file_batch import FileBatch

def create_file_batch(
    organization_id: int,
    name: str,
    db: Session
) -> FileBatch:
    """Crea una entrada simple de FileBatch."""
    try:
        batch = FileBatch(
            organization_id=organization_id,
            name=name,
            created_at=datetime.utcnow()
        )
        db.add(batch)
        db.commit()
        db.refresh(batch)
        return batch
    except Exception as e:
        print(f"❌ Error creando FileBatch: {e}")
        db.rollback()
        raise

def get_batch_by_id_and_org(db: Session, batch_id: int, organization_id: int) -> FileBatch:
    """Obtiene un batch por ID, verificando que pertenezca a la organización."""
    batch = db.query(FileBatch).filter(
        FileBatch.id == batch_id,
        FileBatch.organization_id == organization_id
    ).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch no encontrado")
    return batch

def get_batches_with_files(organization_id: int, db: Session) -> List[FileBatch]:
    """Devuelve todos los batches de una empresa con sus archivos pre-cargados."""
    return (
        db.query(FileBatch)
        .options(joinedload(FileBatch.files)) # Carga los archivos relacionados
        .filter(FileBatch.organization_id == organization_id)
        .order_by(FileBatch.created_at.desc())
        .all()
    )

def delete_batch(db: Session, batch: FileBatch):
    """Elimina un batch de la base de datos."""
    db.delete(batch)
    db.commit()