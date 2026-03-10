from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.startup import run_startup
from app.routers import auth, upload, batch, file, chat

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

# Mirror the old API-gateway URL structure exactly so the frontend needs no changes:
#   /api/users/*  → auth routes      (frontend: auth.ts   /users/login, /users/me …)
#   /api/data/*   → upload/batch/file (frontend: data.ts   /data/upload/, /data/batch/ …)
#   /api/chat/*   → chat routes       (frontend: chat.ts   /api/chat/sessions/…)
app.include_router(auth.router,   prefix="/api/users")
app.include_router(upload.router, prefix="/api/data")
app.include_router(batch.router,  prefix="/api/data")
app.include_router(file.router,   prefix="/api/data")
app.include_router(chat.router,   prefix="/api")


@app.get("/health")
def health():
    return {"ok": True}
