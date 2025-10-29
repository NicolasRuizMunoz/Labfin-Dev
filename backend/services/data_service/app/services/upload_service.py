# app/services/upload_service.py
import os
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException

# --- Importaciones Corregidas ---
from app.services import file_service
from app.enums.file_status import FileStatusEnum
from app.models.file import FileEntry
from app.config import ALLOWED_EXTENSIONS, UPLOAD_DIR
from app.utils.files import (
    generate_checksum,
    is_duplicate,
    validate_extension
)

os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_file_locally_and_create_entry(
    organization_id: int,
    batch_id: int,
    file_category: str,
    file: UploadFile,
    db: Session
) -> tuple[FileEntry, str]:
    """
    Paso 1 del pipeline: Guarda el archivo en disco, valida duplicados
    y crea la entrada en FileEntry con estado PENDING.
    """
    original_filename = file.filename
    logical_filename, ext = os.path.splitext(original_filename)
    ext = ext.lower().strip(".")

    if ext == "zip":
        # TODO: Implementar la lógica de _handle_zip_upload aquí si es necesaria
        raise HTTPException(status_code=400, detail="El manejo de ZIPs debe ser refactorizado.")

    if not validate_extension(ext, ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Extensión de archivo no permitida")

    # Guardar archivo localmente
    saved_name = f"{organization_id}_{int(file.file.fileno())}_{original_filename}"
    saved_path = os.path.join(UPLOAD_DIR, saved_name)

    try:
        with open(saved_path, "wb") as f:
            f.write(file.file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo guardar el archivo: {e}")

    # Calcular checksum y validar duplicados
    checksum = generate_checksum(saved_path)
    if is_duplicate(checksum, organization_id, db):
        os.remove(saved_path) # Limpiar
        raise HTTPException(
            status_code=400,
            detail=f"Archivo duplicado detectado: {original_filename}"
        )

    # Crear la entrada en la base de datos
    file_entry = file_service.create_file_entry(
        db=db,
        organization_id=organization_id,
        batch_id=batch_id,
        original_filename=original_filename,
        logical_filename=logical_filename,
        ext=ext,
        file_category=file_category,
        local_filename=saved_name,
        checksum=checksum
        # Nota: el estado PENDING se define por defecto en file_service
    )

    return file_entry, saved_path