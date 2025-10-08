import httpx
from fastapi import Request, HTTPException

async def proxy_request(method: str, url: str, request: Request | None = None, **kwargs):
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=180) as client:
            if request:
                # Propaga headers “seguros” (omite host y content-length)
                headers = {k: v for k, v in request.headers.items()
                           if k.lower() not in {"host", "content-length"}}
                extra_headers = kwargs.pop("headers", {})
                headers.update(extra_headers)
                kwargs["headers"] = headers

                # Propaga cookies del cliente
                kwargs["cookies"] = request.cookies

            resp = await client.request(method.upper(), url, **kwargs)
            return resp

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy error to {url}: {e}")
