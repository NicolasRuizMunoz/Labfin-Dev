from fastapi import APIRouter
from .auth_routes import router as auth_router
from .data_routes import router as data_router

router = APIRouter()
router.include_router(auth_router, prefix="/users", tags=["users"])
router.include_router(data_router, prefix="/data", tags=["data"])   
