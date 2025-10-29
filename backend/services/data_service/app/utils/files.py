# utils/files.py
import os
import hashlib
from app.models.file import FileEntry
from sqlalchemy.orm import Session
from app.config import UPLOAD_DIR, PROCESSED_DIR

# === Paths (Estos se pueden eliminar si no los usas, ya que los servicios definen los paths) ===
def get_local_file_path(filename: str, is_processed: bool = False) -> str:
    base_dir = PROCESSED_DIR if is_processed else UPLOAD_DIR
    return os.path.join(base_dir, filename)

# === Archivos (Estos SÍ se usan) ===
def delete_file(path: str):
    """Elimina un archivo local si existe."""
    try:
        if os.path.exists(path):
            os.remove(path)
            print(f"🧹 Archivo local eliminado: {path}")
    except Exception as e:
        print(f"⚠️ Error al eliminar archivo local {path}: {e}")

# === Checksum (Este SÍ se usa) ===
def generate_checksum(file_path: str) -> str:
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

# === Validaciones (Estas SÍ se usan) ===
def is_duplicate(checksum: str, organization_id: int, db: Session, exclude_file_id: int | None = None) -> bool:
    """Verifica duplicados usando organization_id."""
    query = db.query(FileEntry).filter_by(
        organization_id=organization_id, # <-- Corregido
        checksum=checksum
    )
    if exclude_file_id:
        query = query.filter(FileEntry.id != exclude_file_id)
    return query.first() is not None

def validate_extension(ext: str, allowed: list[str]) -> bool:
    return ext in allowed