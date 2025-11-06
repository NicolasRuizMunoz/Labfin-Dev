import httpx
from fastapi import Request, HTTPException

HOP_BY_HOP = {"connection","keep-alive","proxy-authenticate","proxy-authorization",
              "te","trailer","transfer-encoding","upgrade","content-length","host"}

def _filtered_headers(h: dict) -> dict:
    return {k: v for k, v in h.items() if k.lower() not in HOP_BY_HOP}

# api_gateway app/utils/proxy.py
async def proxy_request(method: str, url: str, request: Request | None = None, **kwargs):
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=180) as client:
            if request:
                headers = {k: v for k, v in request.headers.items() if k.lower() not in {"host", "content-length"}}
                extra_headers = kwargs.pop("headers", {})
                headers.update(extra_headers)
                kwargs["headers"] = headers
                kwargs["cookies"] = request.cookies

            # DEBUG temporal
            #print("[GW][PROXY] →", method, url)
            #print("[GW][PROXY] headers:", kwargs.get("headers", {}).keys())

            resp = await client.request(method.upper(), url, **kwargs)
            return resp
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy error to {url}: {e}")
