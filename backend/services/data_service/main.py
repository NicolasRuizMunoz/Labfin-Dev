# dataservice/app/main.py
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.startup import init_db
from app.routers import upload, batch, file  # , chat

app = FastAPI(title="LabFin Data Service")

# Inicializa DB una sola vez
init_db()

# --- DEBUG: captura body crudo (útil para ver por qué 422) ---
@app.middleware("http")
async def debug_body(request: Request, call_next):
    raw = await request.body()
    async def receive():
        return {"type": "http.request", "body": raw, "more_body": False}
    request._receive = receive

    if request.url.path.startswith("/file/confirm/bulk"):
        print("=== [DATA DEBUG] INCOMING ===")
        print("Path:", request.url.path, "| Method:", request.method)
        print("Headers:", dict(request.headers))
        try:
            print("Raw body:", raw.decode("utf-8", errors="ignore"))
        except Exception:
            pass

    return await call_next(request)

# --- DEBUG: handler detallado del 422 ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    print("=== [DATA DEBUG] 422 ===")
    print("Path:", request.url.path)
    print("Errors:", exc.errors())
    try:
        print("Raw body:", body.decode("utf-8", errors="ignore"))
    except Exception:
        pass
    print("Headers:", dict(request.headers))
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

# --- Routers ---
app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(batch.router,  prefix="/batch",  tags=["Batch Management"])         # <== ojo: /batch (no /upload/batch)
app.include_router(file.router,   prefix="/file",   tags=["File Management"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "data-service"}
