from app.models.file import FileEntry
from datetime import datetime
from sqlalchemy.orm import Session
from app.enums.file_status import FileStatusEnum
from fastapi import HTTPException
from typing import List, Optional

def create_file_entry(
    db: Session,
    organization_id: int,
    batch_id: int,
    original_filename: str,
    logical_filename: str,
    ext: str,
    file_category: str,
    local_filename: str,
    checksum: str
) -> FileEntry:
    """
    Crea la entrada inicial del archivo en la base de datos.
    El estado por defecto es PENDING e is_active es Falso (hasta que esté listo).
    """
    entry = FileEntry(
        batch_id=batch_id,
        organization_id=organization_id,
        original_filename=original_filename,
        logical_filename=logical_filename,
        file_type=ext,
        file_category=file_category,
        checksum=checksum,
        status=FileStatusEnum.PENDING,
        is_active=False, # <-- No está activo hasta que termine el pipeline
        uploaded_at=datetime.utcnow(),
        local_filename=local_filename
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def get_file_by_id(db: Session, file_id: int, organization_id: int) -> FileEntry:
    """Obtiene un archivo por ID, verificando que pertenezca a la organización."""
    file = db.query(FileEntry).filter(
        FileEntry.id == file_id,
        FileEntry.organization_id == organization_id
    ).first()
    if not file:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return file

def get_files_by_organization(db: Session, organization_id: int) -> List[FileEntry]:
    """
    Lista todos los archivos de una organización que no hayan fallado.
    """
    return (
        db.query(FileEntry)
        .filter(
            FileEntry.organization_id == organization_id,
            FileEntry.status != FileStatusEnum.FAILED
        )
        .order_by(FileEntry.uploaded_at.desc())
        .all()
    )

def set_file_active_status(
    db: Session, 
    file_id: int, 
    organization_id: int, 
    is_active: bool
) -> FileEntry:
    """Actualiza el estado 'is_active' de un archivo."""
    file = get_file_by_id(db, file_id, organization_id)
    
    # Solo puedes activar un archivo que esté LISTO (ACTIVE)
    if is_active and file.status != FileStatusEnum.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail="No se puede activar un archivo que no esté completamente procesado."
        )
            
    file.is_active = is_active
    db.commit()
    db.refresh(file)
    return file

def update_file_s3_paths(
    db: Session, 
    file_id: int, 
    s3_key_original: str, 
    s3_key_processed: str
):
    """(Llamado por Celery) Actualiza las rutas S3 de un archivo."""
    # Usamos merge para asegurar que la sesión de Celery se maneje bien
    file_data = {
        "id": file_id,
        "s3_key_original": s3_key_original,
        "s3_key_processed": s3_key_processed,
    }
    db.merge(FileEntry(**file_data))
    db.commit()

def update_file_status(
    db: Session, 
    file_id: int, 
    status: FileStatusEnum,
    set_active: bool = False
):
    """(Llamado por Celery) Actualiza el estado de un archivo en el pipeline."""
    file_data = {
        "id": file_id,
        "status": status,
    }
    if status == FileStatusEnum.ACTIVE:
        file_data["processed_at"] = datetime.utcnow()
        # Cuando el pipeline lo marca como ACTIVE, lo ponemos is_active=True
        # El usuario luego puede desactivarlo si quiere.
        if set_active:
             file_data["is_active"] = True

    db.merge(FileEntry(**file_data))
    db.commit()


def delete_file_entry(db: Session, file: FileEntry):
    """Elimina el archivo de la base de datos."""
    db.delete(file)
    db.commit()