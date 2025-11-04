import os
from typing import Optional

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.config import ALLOWED_EXTENSIONS, UPLOAD_DIR
from app.services import file_service
from app.utils.files import generate_checksum, is_duplicate


def _validate_ext(original_filename: str) -> str:
    name, ext = os.path.splitext(original_filename or "unnamed")
    ext = ext.lower().lstrip(".")
    allowed = [e.strip().lower() for e in ALLOWED_EXTENSIONS.split(",") if e.strip()]
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Extensión no permitida: .{ext}")
    return ext


def save_upload(
    db: Session,
    file: UploadFile,
    organization_id: int,
    batch_id: Optional[int],
):
    """
    Guarda el archivo localmente (carpeta UPLOAD_DIR) y crea FileEntry en DB.
    El modelo NO tiene category / logical_filename / local_filename → no los usamos.
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    original_filename = file.filename or "unnamed"
    ext = _validate_ext(original_filename)

    # Guarda local
    saved_name = f"{organization_id}__{batch_id or 'no-batch'}__{original_filename}"
    saved_path = os.path.join(UPLOAD_DIR, saved_name)
    with open(saved_path, "wb") as f:
        f.write(file.file.read())

    # Checksum para duplicados por organización
    checksum = generate_checksum(saved_path)
    if is_duplicate(checksum, organization_id, db):
        try:
            os.remove(saved_path)
        except:
            pass
        raise HTTPException(status_code=409, detail="Archivo duplicado (checksum ya existe).")

    # Crea entrada (PENDING)
    file_entry = file_service.create_file_entry(
        db=db,
        organization_id=organization_id,
        batch_id=batch_id,
        original_filename=original_filename,
        ext=ext,
        checksum=checksum,
    )

    return file_entry, saved_path
