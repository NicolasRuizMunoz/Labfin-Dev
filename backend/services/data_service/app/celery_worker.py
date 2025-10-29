# Configuraciones
import os
from celery import Celery

if os.getenv("USE_DOTENV", "true").lower() == "true":
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=".env")

# Inicialización
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

celery_app = Celery("service_data", broker=CELERY_BROKER_URL)
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]

# ⬇️ Registro explícito de tareas
import app.tasks.file_tasks  # ← puede ir al final sin problema
