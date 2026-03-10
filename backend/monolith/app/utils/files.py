import os
import hashlib
from sqlalchemy.orm import Session


def delete_file(path: str) -> None:
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as e:
        print(f"Warning: could not delete {path}: {e}")


def generate_checksum(file_path: str) -> str:
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def is_duplicate(checksum: str, organization_id: int, db: Session, exclude_file_id: int | None = None) -> bool:
    from app.models.file import FileEntry
    q = db.query(FileEntry).filter(
        FileEntry.organization_id == organization_id,
        FileEntry.checksum == checksum,
    )
    if exclude_file_id:
        q = q.filter(FileEntry.id != exclude_file_id)
    return q.first() is not None
