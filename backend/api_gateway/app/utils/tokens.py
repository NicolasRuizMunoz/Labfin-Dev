from fastapi import Request

def get_access_from_cookies(request: Request, cookie_name: str) -> str | None:
    return request.cookies.get(cookie_name)

def bearer_header(token: str | None) -> dict:
    return {"Authorization": f"Bearer {token}"} if token else {}
