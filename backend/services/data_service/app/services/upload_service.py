# app/services/upload_service.py
import os
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException

from app.services import file_service
from app.enums.file_status import FileStatusEnum
from app.config import ALLOWED_EXTENSIONS, UPLOAD_DIR
from app.utils.files import generate_checksum, is_duplicate, validate_extension

def save_upload(
    db: Session,
    file: UploadFile,
    organization_id: int,
    batch_id: int | None,
    file_category: str,
    logical_filename: str | None
):
    original_filename = file.filename or "unnamed"
    name, ext = os.path.splitext(original_filename)
    ext = ext.lower().lstrip(".")

    if not validate_extension(ext, ALLOWED_EXTENSIONS.split(",")):
        raise HTTPException(status_code=400, detail=f"Extensión no permitida: .{ext}")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    saved_name = f"{organization_id}__{batch_id or 'no-batch'}__{original_filename}"
    saved_path = os.path.join(UPLOAD_DIR, saved_name)

    # guardar archivo local
    with open(saved_path, "wb") as f:
        f.write(file.file.read())

    checksum = generate_checksum(saved_path)

    if is_duplicate(checksum, organization_id, db):
        # opcional: borrar el local para no dejar basura
        try: os.remove(saved_path)
        except: pass
        raise HTTPException(status_code=409, detail="Archivo duplicado (checksum ya existe).")

    # crear registro en DB: queda PENDING por defecto
    file_entry = file_service.create_file_entry(
        db=db,
        organization_id=organization_id,
        batch_id=batch_id,
        original_filename=original_filename,
        logical_filename=logical_filename or name,
        ext=ext,
        file_category=file_category,
        local_filename=saved_name,
        checksum=checksum
    )
    return file_entry, saved_path
