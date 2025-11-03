from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import traceback

from app.database.db import get_db
from app.dependencies.auth import get_current_user_data
from app.routers.schemas.auth import UserTokenData
from app.routers.schemas.upload import UploadFileResponse
from app.services import upload_service, file_service
from app.enums.file_status import FileStatusEnum

router = APIRouter()

@router.post("/", response_model=UploadFileResponse, status_code=status.HTTP_201_CREATED)
def upload_file(
    file: UploadFile = File(...),
    file_category: str = Form(...),               # p.ej. "tributario", "financiero", etc.
    batch_id: Optional[int] = Form(None),
    logical_filename: Optional[str] = Form(None), # opcional para renombrado lógico
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    """
    Sube un archivo, crea la entrada en DB, guarda en disco y deja en estado PENDING.
    (La vectorización vendrá en la fase RAG; aquí solo ingesta + trazabilidad)
    """
    try:
        org_id = int(current_user.organization_id)

        file_entry, local_path = upload_service.save_upload(
            db=db,
            file=file,
            organization_id=org_id,
            batch_id=batch_id,
            file_category=file_category,
            logical_filename=logical_filename
        )

        # Marca transición de estado a CONFIRMED si tu pipeline lo requiere luego.
        # Por ahora lo dejamos en PENDING (set por create_file_entry) hasta que un worker procese.
        # Si quieres simular "proceso simple" sin RAG: sube a S3 y marca ACTIVE:
        # file_service.update_file_status(db, file_entry.id, FileStatusEnum.ACTIVE, set_active=True)

        return UploadFileResponse(
            message="Archivo recibido y registrado",
            file=file_entry
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error inesperado en subida: {str(e)}")
