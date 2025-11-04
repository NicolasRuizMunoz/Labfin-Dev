import traceback
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import get_current_user_data
from app.routers.schemas.auth import UserTokenData
from app.routers.schemas.upload import UploadFileResponse
from app.services import upload_service

router = APIRouter()

@router.post("/", response_model=UploadFileResponse, status_code=status.HTTP_201_CREATED)
def upload_file(
    file: UploadFile = File(...),
    batch_id: int = Form(...),  # requerido: tu modelo tiene batch_id NOT NULL
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    """
    Sube un archivo, crea la entrada en DB, guarda en disco y deja en estado inicial (PENDING/STAGED según servicio).
    Sin 'file_category' ni 'logical_filename' (no existen en tu modelo actual).
    """
    try:
        org_id = current_user.organization_id
        if org_id is None:
            raise HTTPException(status_code=403, detail="User does not belong to any organization")
        org_id = int(org_id)

        # Firma mínima esperada: ajusta si tu servicio recibe más/menos parámetros
        file_entry, local_path = upload_service.save_upload(
            db=db,
            file=file,
            organization_id=org_id,
            batch_id=batch_id,
        )

        return UploadFileResponse(
            message="Archivo recibido y registrado",
            file=file_entry,
        )

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error inesperado en subida: {str(e)}")
