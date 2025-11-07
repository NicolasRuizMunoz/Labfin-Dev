# api_gateway/app/routers/chat_router.py
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import Response
from app.utils.proxy import proxy_request
from app.core.config import settings
from app.utils.tokens import get_access_from_cookies

router = APIRouter()
SERVICE_URL = settings.DATA_SERVICE_URL  # ej: http://service_data:8000

def _compose_target(base: str, path: str, request: Request) -> str:
    qs = request.url.query
    return f"{base}/{path}" + (f"?{qs}" if qs else "")

def _auth_header_from_cookie_or_header(request: Request) -> dict:
    """
    Prioriza el token en cookie (como en data_routes).
    Si no hay cookie, intenta propagar 'Authorization' del request (útil si el FE manda Bearer).
    """
    token = get_access_from_cookies(request, settings.COOKIE_ACCESS_NAME)
    if token:
        return {"Authorization": f"Bearer {token}"}
    # fallback: header del cliente (opcional)
    auth = request.headers.get("authorization")
    if auth:
        return {"Authorization": auth}
    raise HTTPException(status_code=401, detail="Missing token")

def _with_content_type_if_body(request: Request, headers: dict) -> dict:
    if request.method not in ("GET", "HEAD"):
        ct = request.headers.get("content-type")
        if ct:
            return {**headers, "content-type": ct}
    return headers

@router.api_route("/sessions", methods=["GET","POST","DELETE"])  # endpoints directos si los quieres explícitos
async def chat_sessions_root(request: Request):
    url = _compose_target(f"{SERVICE_URL}/chat", "sessions", request)
    headers = _with_content_type_if_body(request, _auth_header_from_cookie_or_header(request))
    content = None if request.method in ("GET", "HEAD") else await request.body()
    resp = await proxy_request(method=request.method, url=url, request=request, headers=headers, content=content)
    return Response(content=resp.content, status_code=resp.status_code, headers=resp.headers)

@router.api_route("/sessions/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE"])
async def chat_sessions_any(request: Request, path: str):
    url = _compose_target(f"{SERVICE_URL}/chat/sessions", path, request)
    headers = _with_content_type_if_body(request, _auth_header_from_cookie_or_header(request))
    content = None if request.method in ("GET", "HEAD") else await request.body()
    resp = await proxy_request(method=request.method, url=url, request=request, headers=headers, content=content)
    return Response(content=resp.content, status_code=resp.status_code, headers=resp.headers)

# Catch-all por si agregas nuevos paths en /chat (futuro)
@router.api_route("/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE"])
async def chat_any(request: Request, path: str):
    url = _compose_target(f"{SERVICE_URL}/chat", path, request)
    headers = _with_content_type_if_body(request, _auth_header_from_cookie_or_header(request))
    content = None if request.method in ("GET", "HEAD") else await request.body()
    resp = await proxy_request(method=request.method, url=url, request=request, headers=headers, content=content)
    return Response(content=resp.content, status_code=resp.status_code, headers=resp.headers)
