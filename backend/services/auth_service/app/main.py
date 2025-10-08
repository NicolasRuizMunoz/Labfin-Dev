# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.startup import run_startup
from app.routers.auth_routes import router as auth_router  # añade otros routers cuando los tengas

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tareas de arranque sincronas
    run_startup()
    yield

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(auth_router)
