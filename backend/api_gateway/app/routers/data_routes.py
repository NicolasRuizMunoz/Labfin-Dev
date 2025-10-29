from fastapi import APIRouter, Request, HTTPException
from app.utils.proxy import proxy_request
from app.core.config import settings
from typing import Any
from fastapi.responses import Response

router = APIRouter()

SERVICE_URL = settings.DATA_SERVICE_URL

# --- Rutas de Ingesta (Upload, Batch) ---

@router.api_route("/upload/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_upload(request: Request, path: str):
    """Proxy genérico para todas las rutas /upload/* """
    url = f"{SERVICE_URL}/upload/{path}"
    
    # proxy_request ya maneja headers, cookies, y body
    resp = await proxy_request(
        method=request.method,
        url=url,
        request=request,
        data=await request.body() # Asegúrate de pasar el body
    )
    return Response(content=resp.content, status_code=resp.status_code, headers=resp.headers)

# --- Rutas de Gestión (File) ---

@router.api_route("/file/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_file(request: Request, path: str):
    """Proxy genérico para todas las rutas /file/* """
    url = f"{SERVICE_URL}/file/{path}"
    
    resp = await proxy_request(
        method=request.method,
        url=url,
        request=request,
        data=await request.body()
    )
    return Response(content=resp.content, status_code=resp.status_code, headers=resp.headers)

# --- Rutas de Chat (Fase 2 - Próximamente) ---

# @router.api_route("/chat/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
# async def proxy_chat(request: Request, path: str):
#     url = f"{SERVICE_URL}/chat/{path}"
#     resp = await proxy_request(method=request.method, url=url, request=request, data=await request.body())
#     return Response(content=resp.content, status_code=resp.status_code, headers=resp.headers)