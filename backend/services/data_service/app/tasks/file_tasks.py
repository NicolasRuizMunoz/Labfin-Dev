from app.celery_worker import celery_app
from sqlalchemy.orm import Session
from app.database.db import SessionLocal
from app.services import file_processing_service, file_service, s3_service
from app.enums.file_status import FileStatusEnum
from app.utils.files import delete_file
import os

@celery_app.task
def run_rag_pipeline(file_id: int, local_path: str):
    """
    El pipeline de INGESTA (Etapa 1).
    Orquesta los servicios para procesar un archivo y subirlo a S3.
    """
    db: Session = SessionLocal()
    try:
        # Obtenemos el file_entry usando el servicio
        # (Usamos la sesión de la tarea)
        file_entry = db.query(file_service.FileEntry).filter(
            file_service.FileEntry.id == file_id
        ).first()
        
        if not file_entry:
            print(f"❌ Error en Tarea: FileEntry {file_id} no encontrado.")
            return

        print(f"▶️ Iniciando Pipeline de Ingesta para {file_entry.original_filename} (ID: {file_id})")

        # --- 1. PROCESAR (PDF -> TXT Normalizado) ---
        file_service.update_file_status(db, file_id, FileStatusEnum.PROCESSING)
        print(f"🔄 [1/3] Procesando a TXT...")
        processed_txt_path = file_processing_service.process_file_to_text(local_path)
        print(f"✅ [1/3] Procesado a TXT.")

        # --- 2. SUBIR A S3 ---
        file_service.update_file_status(db, file_id, FileStatusEnum.UPLOADING)
        print(f"🔄 [2/3] Subiendo a S3...")

        # Construir S3 keys
        processed_filename = os.path.basename(processed_txt_path)
        s3_key_orig = s3_service.build_file_s3_key(
            company_id=file_entry.organization_id,
            local_filename=file_entry.local_filename,
            is_processed=False,
            batch_id=file_entry.batch_id,
            category=file_entry.file_category
        )
        s3_key_proc = s3_service.build_file_s3_key(
            company_id=file_entry.organization_id,
            local_filename=processed_filename,
            is_processed=True,
            batch_id=file_entry.batch_id,
            category=file_entry.file_category
        )

        # Subir archivos
        s3_service.upload_file(local_path, s3_key_orig)
        s3_service.upload_file(processed_txt_path, s3_key_proc)
        
        # Actualizar la BD con las rutas de S3
        file_service.update_file_s3_paths(db, file_id, s3_key_orig, s3_key_proc)
        print(f"✅ [2/3] Subido a S3.")

        # --- 3. FINALIZAR (Sin Vectorización por ahora) ---
        print(f"🔄 [3/3] Finalizando y limpiando...")
        
        # ¡IMPORTANTE!
        # Marcamos el archivo como ACTIVE y 'is_active = True'
        # El usuario puede desactivarlo luego si quiere.
        file_service.update_file_status(db, file_id, FileStatusEnum.ACTIVE, set_active=True)
        
        delete_file(local_path)
        delete_file(processed_txt_path)
        print(f"✅ [3/3] Limpieza finalizada.")
        
        print(f"🏁 Pipeline de Ingesta completado para {file_entry.original_filename}")

    except Exception as e:
        print(f"❌ Error en Pipeline de Ingesta (File ID: {file_id}): {e}")
        db.rollback()
        db_fail_session = SessionLocal()
        try:
            # Marcar como FAILED
            file_service.update_file_status(db_fail_session, file_id, FileStatusEnum.FAILED)
        finally:
            db_fail_session.close()
            
    finally:
        db.close()