from fastapi import FastAPI
from app.startup import init_db               # <-- CORREGIDO
from app.routers import upload, batch, file # <-- CORREGIDO

app = FastAPI(title="LabFin Data Service")

# Inicializa la base de datos y crea tablas
init_db()

# --- Rutas de Ingesta y Gestión (Fase 1) ---
app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(batch.router, prefix="/upload/batch", tags=["Batch Management"])
app.include_router(file.router, prefix="/file", tags=["File Management"])

# --- Rutas de Consulta (Fase 2 - Próximamente) ---
# from app.routers import chat # (Así sería cuando lo agregues)
# app.include_router(chat.router, prefix="/chat", tags=["Chat RAG"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "data-service"}