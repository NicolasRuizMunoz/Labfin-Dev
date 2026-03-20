"""
Simple in-memory token blacklist for logout revocation.

Tokens are stored with their expiration time and cleaned up periodically.
For multi-instance deployments, replace with Redis or a DB table.
"""
import threading
import time
from typing import Dict

import jwt

from app.config import SECRET_KEY, ALGORITHM

_lock = threading.Lock()
_blacklist: Dict[str, float] = {}  # token_hash -> exp timestamp
_CLEANUP_INTERVAL = 300  # seconds
_last_cleanup: float = 0.0


def _token_key(token: str) -> str:
    """Use a hash of the token as key to save memory."""
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()


def _cleanup() -> None:
    """Remove expired entries from the blacklist."""
    global _last_cleanup
    now = time.time()
    if now - _last_cleanup < _CLEANUP_INTERVAL:
        return
    _last_cleanup = now
    expired = [k for k, exp in _blacklist.items() if exp < now]
    for k in expired:
        _blacklist.pop(k, None)


def blacklist_token(token: str) -> None:
    """Add a token to the blacklist until its natural expiration."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        exp = payload.get("exp", 0)
    except jwt.InvalidTokenError:
        return
    with _lock:
        _blacklist[_token_key(token)] = float(exp)
        _cleanup()


def is_blacklisted(token: str) -> bool:
    """Check if a token has been revoked."""
    key = _token_key(token)
    with _lock:
        _cleanup()
        return key in _blacklist
