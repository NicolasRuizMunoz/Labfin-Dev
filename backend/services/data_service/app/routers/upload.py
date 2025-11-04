# app/routers/upload.py
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import traceback

from app.database.db import get_db
from app.dependencies.auth import get_current_user_data
from app.routers.schemas.auth import UserTokenData
from app.routers.schemas.upload import UploadFileResponse
from app.services import upload_service

router = APIRouter()

@router.post("/", response_model=UploadFileResponse, status_code=status.HTTP_201_CREATED)
def upload_file(
    file: UploadFile = File(...),
    batch_id: Optional[int] = Form(None),
    logical_filename: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    """
    Sube un archivo (multipart/form-data). batch_id es opcional.
    """
    try:
        org_id = int(current_user.organization_id)

        file_entry, local_path = upload_service.save_upload(
            db=db,
            file=file,
            organization_id=org_id,
            batch_id=batch_id,                
            logical_filename=logical_filename
        )

        return UploadFileResponse(
            message="Archivo recibido y registrado",
            file=file_entry
        )

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error inesperado en subida: {str(e)}")
