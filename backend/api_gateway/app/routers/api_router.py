from fastapi import APIRouter
from .auth_routes import router as auth_router
from .data_routes import router as data_router
from .chat_router import router as chat_router

router = APIRouter()
router.include_router(auth_router, prefix="/users", tags=["users"])
router.include_router(data_router, prefix="/data", tags=["data"])   
router.include_router(chat_router, prefix="/chat", tags=["chat"])
