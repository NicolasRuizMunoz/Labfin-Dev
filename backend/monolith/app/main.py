from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.startup import run_startup
from app.routers import auth, upload, file, chat, licitaciones, admin, escenarios, simulaciones, contact
from app.middleware.rate_limit import RateLimitMiddleware

import logging
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_startup()
    yield


app = FastAPI(title="LabFin", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)

# Mirror the old API-gateway URL structure exactly so the frontend needs no changes:
#   /api/users/*  → auth routes      (frontend: auth.ts   /users/login, /users/me …)
#   /api/data/*   → upload/file/licitacion (frontend: data.ts, tenders.ts)
#   /api/chat/*   → chat routes       (frontend: chat.ts   /api/chat/sessions/…)
app.include_router(auth.router,         prefix="/api/users")
app.include_router(upload.router,       prefix="/api/data")
app.include_router(file.router,         prefix="/api/data")
app.include_router(licitaciones.router, prefix="/api/data")
app.include_router(escenarios.router,    prefix="/api/data")
app.include_router(simulaciones.router,  prefix="/api/data")
app.include_router(chat.router,         prefix="/api")
app.include_router(admin.router,        prefix="/api/admin")
app.include_router(contact.router,      prefix="/api/contact")


@app.get("/health")
def health():
    return {"ok": True}