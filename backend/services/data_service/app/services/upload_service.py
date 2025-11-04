# app/services/upload_service.py (corregido)
import os
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from typing import Optional, Iterable

from app.services import file_service
from app.config import ALLOWED_EXTENSIONS, UPLOAD_DIR
from app.utils.files import generate_checksum, is_duplicate

def _allowed_set() -> set[str]:
    """Normaliza ALLOWED_EXTENSIONS que puede venir como 'pdf,docx' o ['pdf','docx']"""
    if isinstance(ALLOWED_EXTENSIONS, str):
        items = [x.strip().lower() for x in ALLOWED_EXTENSIONS.split(",") if x.strip()]
    elif isinstance(ALLOWED_EXTENSIONS, (list, tuple, set)):
        items = [str(x).strip().lower() for x in ALLOWED_EXTENSIONS]
    else:
        items = []
    return set(items)

def _validate_ext(original_filename: str) -> str:
    name, ext = os.path.splitext(original_filename or "")
    ext = ext.lower().lstrip(".")
    allowed = _allowed_set()
    if not ext or ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Extensión no permitida: .{ext or '?'}")
    return ext

def save_upload(
    db: Session,
    file: UploadFile,
    organization_id: int,
    batch_id: Optional[int],
    logical_filename: Optional[str],
):
    original_filename = file.filename or "unnamed"
    ext = _validate_ext(original_filename)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    saved_name = f"{organization_id}__{batch_id or 'no-batch'}__{original_filename}"
    saved_path = os.path.join(UPLOAD_DIR, saved_name)

    with open(saved_path, "wb") as f:
        f.write(file.file.read())

    checksum = generate_checksum(saved_path)

    if is_duplicate(checksum, organization_id, db):
        try: os.remove(saved_path)
        except: pass
        raise HTTPException(status_code=409, detail="Archivo duplicado (checksum ya existe).")

    file_entry = file_service.create_file_entry(
        db=db,
        organization_id=organization_id,
        batch_id=batch_id,
        original_filename=original_filename,
        file_type=ext,
        checksum=checksum,
    )
    return file_entry, saved_path
