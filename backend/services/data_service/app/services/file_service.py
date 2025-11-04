# app/services/file_service.py (corregido)
from app.models.file import FileEntry
from datetime import datetime
from sqlalchemy.orm import Session
from app.enums.file_status import FileStatusEnum
from fastapi import HTTPException
from typing import List, Optional

def create_file_entry(
    db: Session,
    organization_id: int,
    batch_id: Optional[int],
    original_filename: str,
    file_type: str,
    checksum: str,
) -> FileEntry:
    entry = FileEntry(
        batch_id=batch_id,
        organization_id=organization_id,
        original_filename=original_filename,
        file_type=file_type,
        status=FileStatusEnum.PENDING,
        is_active=False,
        uploaded_at=datetime.utcnow(),
        checksum=checksum,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def get_file_by_id(db: Session, file_id: int, organization_id: int) -> FileEntry:
    file = db.query(FileEntry).filter(
        FileEntry.id == file_id,
        FileEntry.organization_id == organization_id
    ).first()
    if not file:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return file

def get_files_by_organization(db: Session, organization_id: int) -> List[FileEntry]:
    return (
        db.query(FileEntry)
        .filter(FileEntry.organization_id == organization_id, FileEntry.status != FileStatusEnum.FAILED)
        .order_by(FileEntry.uploaded_at.desc())
        .all()
    )

def set_file_active_status(db: Session, file_id: int, organization_id: int, is_active: bool) -> FileEntry:
    file = get_file_by_id(db, file_id, organization_id)
    # si quieres exigir ACTIVE antes de activar, deja esta validación o quítala
    # if is_active and file.status != FileStatusEnum.ACTIVE:
    #     raise HTTPException(status_code=400, detail="No se puede activar un archivo que no esté ACTIVE.")
    file.is_active = is_active
    db.commit()
    db.refresh(file)
    return file

def update_file_s3_paths(db: Session, file_id: int, s3_key_original: str, s3_key_processed: str):
    db.merge(FileEntry(id=file_id, s3_key_original=s3_key_original, s3_key_processed=s3_key_processed))
    db.commit()

def update_file_status(db: Session, file_id: int, status: FileStatusEnum, set_active: bool = False):
    data = {"id": file_id, "status": status}
    if status == FileStatusEnum.ACTIVE and set_active:
        data["is_active"] = True
    db.merge(FileEntry(**data))
    db.commit()

def delete_file_entry(db: Session, file: FileEntry):
    db.delete(file)
    db.commit()
