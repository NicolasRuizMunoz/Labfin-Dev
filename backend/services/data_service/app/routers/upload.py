# app/routers/upload.py
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import traceback

# --- Importaciones Corregidas ---
from app.database.db import get_db
from app.dependencies.auth import get_current_user_data
from app.routers.schemas.auth import UserTokenData # <-- Asegúrate de tener schemas/auth.py
from app.routers.schemas.upload import UploadFileResponse # <-- El nuevo schema de respuesta
from app.services import upload_service, file_batch_service
from app.tasks.file_tasks import run_rag_pipeline # <-- La nueva tarea de Celery

router = APIRouter()

@router.post("/", response_model=UploadFileResponse)
def upload_file_for_rag(
    file: UploadFile = File(...),
    category: str = Form("documentos"),
    batch_id: Optional[int] = Form(None),
    new_batch_name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data)
):
    """
    Endpoint unificado para subir archivos al sistema RAG.
    1. Guarda el archivo localmente.
    2. Crea/Asigna un FileBatch.
    3. Crea el FileEntry con estado PENDING.
    4. Encola la tarea de Celery 'run_rag_pipeline' para procesarlo.
    """
    # Usamos organization_id, que viene de tu token
    org_id = int(current_user.organization_id)

    if not batch_id and not new_batch_name:
        new_batch_name = f"Subida - {file.filename}"

    try:
        # 1. Obtener o crear el FileBatch
        if batch_id:
            batch = file_batch_service.get_batch_by_id_and_org(db, batch_id, org_id)
        else:
            batch = file_batch_service.create_file_batch(
                organization_id=org_id,
                name=new_batch_name,
                db=db
            )

        # 2. Guardar archivo local y crear FileEntry (estado PENDING)
        file_entry, local_path = upload_service.save_file_locally_and_create_entry(
            organization_id=org_id,
            batch_id=batch.id,
            file_category=category,
            file=file,
            db=db
        )

        # 3. Encolar la tarea de Celery para el procesamiento RAG
        run_rag_pipeline.delay(file_id=file_entry.id, local_path=local_path)
        
        print(f"🟢 [service_data] Archivo {file_entry.id} encolado para pipeline RAG.")

        # Devuelve el nuevo schema de respuesta
        return UploadFileResponse(
            message="Archivo encolado para procesamiento RAG",
            file=file_entry 
        )

    except HTTPException as e:
        print(f"🔴 [service_data] HTTPException: {e.status_code} {e.detail}")
        raise e
    except Exception as e:
        print(f"🔴 [service_data] Error inesperado: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error inesperado en servicio de subida")