from datetime import datetime
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.file_batch import FileBatch


def create_file_batch(db: Session, organization_id: int, name: str) -> FileBatch:
    batch = FileBatch(
        organization_id=organization_id,
        name=name,
        created_at=datetime.utcnow(),  # si tu modelo ya tiene default, podrías omitirlo
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def get_batch_by_id_and_org(db: Session, batch_id: int, organization_id: int) -> FileBatch:
    batch = (
        db.query(FileBatch)
        .filter(FileBatch.id == batch_id, FileBatch.organization_id == organization_id)
        .first()
    )
    if not batch:
        raise HTTPException(status_code=404, detail="Batch no encontrado")
    return batch


def get_batches_with_files(organization_id: int, db: Session) -> List[FileBatch]:
    return (
        db.query(FileBatch)
        .options(joinedload(FileBatch.files))
        .filter(FileBatch.organization_id == organization_id)
        .order_by(FileBatch.id.desc())
        .all()
    )


def delete_batch(db: Session, batch: FileBatch) -> None:
    db.delete(batch)
    db.commit()
