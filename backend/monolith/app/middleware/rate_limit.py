"""
Simple in-memory rate limiter middleware for auth endpoints.
For production at scale, replace with Redis-backed solution.
"""
import time
import threading
from collections import defaultdict
from typing import Dict, Tuple

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Config
_MAX_ATTEMPTS = 10          # max requests per window
_WINDOW_SECONDS = 60        # sliding window size
_RATE_LIMITED_PATHS = {"/api/users/login", "/api/users/register"}

_lock = threading.Lock()
_attempts: Dict[str, list] = defaultdict(list)  # ip -> [timestamps]
_CLEANUP_INTERVAL = 120
_last_cleanup = 0.0


def _cleanup(now: float) -> None:
    global _last_cleanup
    if now - _last_cleanup < _CLEANUP_INTERVAL:
        return
    _last_cleanup = now
    cutoff = now - _WINDOW_SECONDS * 2
    stale = [k for k, v in _attempts.items() if not v or v[-1] < cutoff]
    for k in stale:
        del _attempts[k]


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method != "POST" or request.url.path not in _RATE_LIMITED_PATHS:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        cutoff = now - _WINDOW_SECONDS

        with _lock:
            _cleanup(now)
            timestamps = _attempts[client_ip]
            # Remove old entries outside window
            _attempts[client_ip] = [t for t in timestamps if t > cutoff]
            if len(_attempts[client_ip]) >= _MAX_ATTEMPTS:
                retry_after = int(_WINDOW_SECONDS - (now - _attempts[client_ip][0]))
                return JSONResponse(
                    status_code=429,
                    content={"detail": f"Too many attempts. Retry after {max(retry_after, 1)}s."},
                    headers={"Retry-After": str(max(retry_after, 1))},
                )
            _attempts[client_ip].append(now)

        return await call_next(request)
