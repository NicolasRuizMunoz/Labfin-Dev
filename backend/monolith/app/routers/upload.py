import traceback
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import get_current_user, UserTokenData, require_org
from app.schemas.upload import UploadFileResponse
from app.services import upload_service, licitacion_service

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/", response_model=UploadFileResponse, status_code=status.HTTP_201_CREATED)
def upload_file(
    file: UploadFile = File(...),
    licitacion_id: Optional[int] = Form(None),
    logical_filename: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = require_org(current_user)
    if licitacion_id is not None:
        licitacion_service.get_one(db, org_id, licitacion_id)
    try:
        file_entry, _ = upload_service.save_upload(
            db=db,
            file=file,
            organization_id=org_id,
            licitacion_id=licitacion_id,
            logical_filename=logical_filename,
        )
        return UploadFileResponse(message="Archivo recibido y registrado", file=file_entry)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error inesperado al subir archivo: {e}")
