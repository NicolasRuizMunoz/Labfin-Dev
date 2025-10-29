# dataservice/main.py
from fastapi import FastAPI
from backend.services.data_service.app.startup import init_db
from routers import upload, batch, file #, chat

app = FastAPI(title="LabFin Data Service")

# Inicializa la base de datos y crea tablas
init_db()

# --- Rutas de Ingesta y Gestión ---
app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(batch.router, prefix="/upload/batch", tags=["Batch Management"])
app.include_router(file.router, prefix="/file", tags=["File Management"])

# --- Rutas de Consulta (Fase 2 - Próximamente) ---
# app.include_router(chat.router, prefix="/chat", tags=["Chat RAG"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "data-service"}