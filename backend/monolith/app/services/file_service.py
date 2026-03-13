from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.enums.file_status import FileStatusEnum
from app.models.file import FileEntry


def create_file_entry(
    db: Session,
    organization_id: int,
    original_filename: str,
    file_type: str,
    checksum: str,
    licitacion_id: Optional[int] = None,
) -> FileEntry:
    entry = FileEntry(
        licitacion_id=licitacion_id,
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
        FileEntry.organization_id == organization_id,
    ).first()
    if not file:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return file


def get_file_by_id_raw(db: Session, file_id: int) -> Optional[FileEntry]:
    return db.query(FileEntry).filter(FileEntry.id == file_id).first()


def get_files_by_licitacion(db: Session, organization_id: int, licitacion_id: int) -> List[FileEntry]:
    return (
        db.query(FileEntry)
        .filter(
            FileEntry.organization_id == organization_id,
            FileEntry.licitacion_id == licitacion_id,
            FileEntry.status != FileStatusEnum.FAILED,
        )
        .order_by(FileEntry.uploaded_at.desc())
        .all()
    )


def get_files_by_organization(db: Session, organization_id: int) -> List[FileEntry]:
    return (
        db.query(FileEntry)
        .filter(
            FileEntry.organization_id == organization_id,
            FileEntry.status != FileStatusEnum.FAILED,
        )
        .order_by(FileEntry.uploaded_at.desc())
        .all()
    )


def set_file_active_status(db: Session, file_id: int, organization_id: int, is_active: bool) -> FileEntry:
    file = get_file_by_id(db, file_id, organization_id)
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
