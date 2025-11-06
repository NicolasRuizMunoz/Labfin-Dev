# api_gateway/routers/data_routes.py
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import Response
from app.utils.proxy import proxy_request
from app.core.config import settings
from app.utils.tokens import get_access_from_cookies

router = APIRouter()
SERVICE_URL = settings.DATA_SERVICE_URL

def _auth_header_from_cookie(request: Request) -> dict:
    token = get_access_from_cookies(request, settings.COOKIE_ACCESS_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    return {"Authorization": f"Bearer {token}"}

def _compose_target(base: str, path: str, request: Request) -> str:
    qs = request.url.query
    return f"{base}/{path}" + (f"?{qs}" if qs else "")

def _with_content_type_if_body(request: Request, headers: dict) -> dict:
    # Si hay body y el cliente envió content-type, lo propagamos
    if request.method not in ("GET", "HEAD"):
        ct = request.headers.get("content-type")
        if ct:
            return {**headers, "content-type": ct}
    return headers

@router.api_route("/upload/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE"])
async def proxy_upload(request: Request, path: str):
    url = _compose_target(f"{SERVICE_URL}/upload", path, request)
    headers = _with_content_type_if_body(request, _auth_header_from_cookie(request))
    content = None if request.method in ("GET", "HEAD") else await request.body()
    resp = await proxy_request(method=request.method, url=url, request=request, headers=headers, content=content)
    return Response(content=resp.content, status_code=resp.status_code, headers=resp.headers)

@router.api_route("/file/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE"])
async def proxy_file(request: Request, path: str):
    url = _compose_target(f"{SERVICE_URL}/file", path, request)
    headers = _with_content_type_if_body(request, _auth_header_from_cookie(request))
    content = None if request.method in ("GET", "HEAD") else await request.body()

    if content:
        print("Body preview:", content[:200])

    resp = await proxy_request(method=request.method, url=url, request=request, headers=headers, content=content)
    return Response(content=resp.content, status_code=resp.status_code, headers=resp.headers)

@router.api_route("/batch/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE"])
async def proxy_batch(request: Request, path: str):
    url = _compose_target(f"{SERVICE_URL}/batch", path, request)
    headers = _with_content_type_if_body(request, _auth_header_from_cookie(request))
    content = None if request.method in ("GET", "HEAD") else await request.body()
    resp = await proxy_request(method=request.method, url=url, request=request, headers=headers, content=content)
    return Response(content=resp.content, status_code=resp.status_code, headers=resp.headers)
