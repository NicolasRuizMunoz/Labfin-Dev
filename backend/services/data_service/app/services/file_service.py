from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.file import FileEntry
from app.enums.file_status import FileStatusEnum


# ---------- CREATE / READ ----------

def create_file_entry(
    db: Session,
    organization_id: int,
    batch_id: Optional[int],
    original_filename: str,
    ext: str,
    checksum: str,
) -> FileEntry:
    """
    Crea la entrada inicial del archivo en la base de datos.
    Estado inicial: PENDING. is_active=False (hasta que el pipeline lo deje listo).
    """
    entry = FileEntry(
        batch_id=batch_id,
        organization_id=organization_id,
        original_filename=original_filename,
        file_type=ext,
        checksum=checksum,
        status=FileStatusEnum.PENDING,
        is_active=False,
        uploaded_at=datetime.utcnow(),
        # s3_key_original / s3_key_processed quedan en None al inicio
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_file_by_id(db: Session, file_id: int, organization_id: int) -> FileEntry:
    f = (
        db.query(FileEntry)
        .filter(FileEntry.id == file_id, FileEntry.organization_id == organization_id)
        .first()
    )
    if not f:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return f


def get_files_by_organization(db: Session, org_id: int) -> List[FileEntry]:
    """
    Devuelve todos los archivos de la organización (puedes filtrar por estados si lo deseas).
    """
    return (
        db.query(FileEntry)
        .filter(FileEntry.organization_id == org_id)
        .order_by(FileEntry.uploaded_at.desc())
        .all()
    )


# ---------- UPDATE ----------

def set_active_flag(db: Session, file: FileEntry, is_active: bool) -> None:
    """
    Cambia el flag is_active. (Si deseas forzar ACTIVE para activar, haz la validación aquí).
    """
    # Si quieres restringir activación sólo cuando status==ACTIVE, descomenta:
    # if is_active and file.status != FileStatusEnum.ACTIVE:
    #     raise HTTPException(status_code=400, detail="No se puede activar un archivo que no esté ACTIVE.")

    file.is_active = is_active
    db.add(file)
    db.commit()
    db.refresh(file)


def update_file_s3_paths(
    db: Session,
    file_id: int,
    s3_key_original: Optional[str] = None,
    s3_key_processed: Optional[str] = None,
) -> FileEntry:
    file = db.query(FileEntry).filter(FileEntry.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    if s3_key_original is not None:
        file.s3_key_original = s3_key_original
    if s3_key_processed is not None:
        file.s3_key_processed = s3_key_processed

    db.add(file)
    db.commit()
    db.refresh(file)
    return file


def update_file_status(
    db: Session,
    file_id: int,
    new_status: FileStatusEnum,
    set_active: Optional[bool] = None,
) -> FileEntry:
    file = db.query(FileEntry).filter(FileEntry.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    file.status = new_status
    if new_status == FileStatusEnum.ACTIVE:
        file.processed_at = datetime.utcnow()
        if set_active is not None:
            file.is_active = set_active

    db.add(file)
    db.commit()
    db.refresh(file)
    return file


# ---------- DELETE ----------

def delete_file_entry(db: Session, file: FileEntry) -> None:
    db.delete(file)
    db.commit()
