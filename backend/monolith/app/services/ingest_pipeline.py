import os
from sqlalchemy.orm import Session

from app.enums.file_status import FileStatusEnum
from app.models.file import FileEntry
from app.services import file_service, file_processing_service, s3_service
from app.utils.files import delete_file


def process_and_upload(db: Session, file_id: int, local_path: str, cleanup: bool = True) -> None:
    fe = db.query(FileEntry).filter(FileEntry.id == file_id).first()
    if not fe:
        raise ValueError(f"FileEntry {file_id} does not exist")

    if not os.path.exists(local_path):
        raise FileNotFoundError(f"Local path not found: {local_path}")

    file_service.update_file_status(db, file_id, FileStatusEnum.PROCESSING)
    processed_txt_path = file_processing_service.process_file_to_text(local_path)

    file_service.update_file_status(db, file_id, FileStatusEnum.UPLOADING)
    processed_filename = os.path.basename(processed_txt_path)
    original_filename = os.path.basename(local_path)

    s3_key_orig = s3_service.build_file_s3_key(
        organization_id=fe.organization_id,
        local_filename=original_filename,
        is_processed=False,
        batch_id=fe.batch_id,
    )
    s3_key_proc = s3_service.build_file_s3_key(
        organization_id=fe.organization_id,
        local_filename=processed_filename,
        is_processed=True,
        batch_id=fe.batch_id,
    )

    ok1 = s3_service.upload_file(local_path, s3_key_orig)
    ok2 = s3_service.upload_file(processed_txt_path, s3_key_proc)
    if not (ok1 and ok2):
        raise RuntimeError("One or both S3 uploads failed")

    file_service.update_file_s3_paths(db, file_id, s3_key_orig, s3_key_proc)
    file_service.update_file_status(db, file_id, FileStatusEnum.ACTIVE, set_active=True)

    if cleanup:
        delete_file(local_path)
        delete_file(processed_txt_path)
