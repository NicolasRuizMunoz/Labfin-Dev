from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import Response
from app.utils.proxy import proxy_request
from app.core.config import settings
from app.utils.tokens import get_access_from_cookies

router = APIRouter()
SERVICE_URL = settings.DATA_SERVICE_URL

def _auth_header_from_cookie(request: Request) -> dict:
    token = get_access_from_cookies(request, settings.COOKIE_ACCESS_NAME)  # "access_token"
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    return {"Authorization": f"Bearer {token}"}

def _compose_target(base: str, path: str, request: Request) -> str:
    # preserva el querystring
    qs = request.url.query
    return f"{base}/{path}" + (f"?{qs}" if qs else "")

@router.api_route("/upload/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE"])
async def proxy_upload(request: Request, path: str):
    url = _compose_target(f"{SERVICE_URL}/upload", path, request)
    headers = _auth_header_from_cookie(request)
    content = None if request.method in ("GET", "HEAD") else await request.body()

    # DEBUG opcional: comenta en prod
    print("[GW] /upload ->", url, "| has Bearer:", "Authorization" in headers)

    resp = await proxy_request(
        method=request.method,
        url=url,
        request=request,
        headers=headers,     # SIEMPRE Bearer
        content=content,     # RAW (JSON o multipart); None en GET/HEAD
    )
    return Response(content=resp.content, status_code=resp.status_code, headers=resp.headers)

@router.api_route("/file/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE"])
async def proxy_file(request: Request, path: str):
    url = _compose_target(f"{SERVICE_URL}/file", path, request)
    headers = _auth_header_from_cookie(request)
    content = None if request.method in ("GET", "HEAD") else await request.body()

    # DEBUG opcional: comenta en prod
    print("[GW] /file ->", url, "| has Bearer:", "Authorization" in headers)

    resp = await proxy_request(
        method=request.method,
        url=url,
        request=request,
        headers=headers,
        content=content,
    )
    return Response(content=resp.content, status_code=resp.status_code, headers=resp.headers)
