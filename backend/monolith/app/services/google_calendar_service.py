"""Google Calendar integration.

Independent OAuth flow (separate from login): the user grants access to the
`calendar.events` scope, the backend stores the refresh token in
`oauth_accounts.refresh_token`, and licitacion deadlines are synced as events
on the user's primary calendar.

Wire-protocol shape (no SDK dependency beyond `requests`):
- OAuth code exchange:  POST https://oauth2.googleapis.com/token
- Calendar API:         {GET,POST,PATCH,DELETE} https://www.googleapis.com/calendar/v3/...

State token is a short-lived JWT signed with SECRET_KEY containing the user_id,
so the callback (which has no auth cookies from the Google domain) can identify
the connecting user.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone, date
from typing import List, Optional
from urllib.parse import urlencode

import jwt
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import (
    ALGORITHM,
    GOOGLE_CALENDAR_REDIRECT_URI,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    SECRET_KEY,
)
from app.models.oauth_account import OAuthAccount

logger = logging.getLogger(__name__)

CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events"
OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
CALENDAR_API = "https://www.googleapis.com/calendar/v3"
STATE_TTL_MINUTES = 10


def _ensure_configured() -> None:
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=501,
            detail="Google Calendar no está configurado en el servidor.",
        )


def _requests():
    """Lazy import so the app boots even when `requests` is missing."""
    try:
        import requests  # noqa: WPS433
    except ImportError:
        raise HTTPException(
            500,
            "Falta la dependencia 'requests'. Ejecuta `pip install -r requirements.txt`.",
        )
    return requests


# ── State token (signed user_id, expires) ────────────────────────────────────
def _encode_state(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "typ": "gcal_state",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=STATE_TTL_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_state(state: str) -> int:
    try:
        payload = jwt.decode(state, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(400, "Estado expirado, reintenta la conexión.")
    except jwt.InvalidTokenError:
        raise HTTPException(400, "Estado inválido.")
    if payload.get("typ") != "gcal_state":
        raise HTTPException(400, "Estado inválido.")
    return int(payload["sub"])


# ── OAuth URLs ───────────────────────────────────────────────────────────────
def build_consent_url(user_id: int) -> str:
    _ensure_configured()
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_CALENDAR_REDIRECT_URI,
        "response_type": "code",
        "scope": CALENDAR_SCOPE,
        "access_type": "offline",
        "prompt": "consent",  # force refresh_token on every connect
        "include_granted_scopes": "true",
        "state": _encode_state(user_id),
    }
    return f"{OAUTH_AUTH_URL}?{urlencode(params)}"


# ── Code exchange + token refresh ────────────────────────────────────────────
def _post_token(data: dict) -> dict:
    resp = _requests().post(OAUTH_TOKEN_URL, data=data, timeout=15)
    if resp.status_code >= 400:
        logger.warning("Google token endpoint error %s: %s", resp.status_code, resp.text)
        raise HTTPException(502, "Google rechazó la autorización.")
    return resp.json()


def exchange_code(code: str) -> dict:
    _ensure_configured()
    return _post_token({
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_CALENDAR_REDIRECT_URI,
        "grant_type": "authorization_code",
    })


def refresh_access_token(refresh_token: str) -> dict:
    _ensure_configured()
    return _post_token({
        "refresh_token": refresh_token,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "grant_type": "refresh_token",
    })


def store_tokens_from_exchange(db: Session, user_id: int, token_payload: dict) -> OAuthAccount:
    """Persist tokens returned by the OAuth exchange against the user's google account.

    We need the user's google `sub` to satisfy the unique (provider, subject) constraint.
    We fetch it from the `id_token` claim included in the response.
    """
    id_token_str = token_payload.get("id_token")
    if not id_token_str:
        raise HTTPException(502, "Google no devolvió un id_token.")

    # Decode without verifying signature: we already trust the token endpoint TLS.
    try:
        claims = jwt.decode(id_token_str, options={"verify_signature": False})
    except Exception as exc:
        logger.warning("Failed to decode id_token: %s", exc)
        raise HTTPException(502, "id_token inválido.")
    sub = claims.get("sub")
    email = claims.get("email", "")
    if not sub:
        raise HTTPException(502, "id_token sin sub.")

    expires_in = int(token_payload.get("expires_in", 3600))
    expires_at = datetime.utcnow() + timedelta(seconds=expires_in - 60)

    acct = (
        db.query(OAuthAccount)
        .filter(OAuthAccount.provider == "google", OAuthAccount.subject == sub)
        .first()
    )
    if not acct:
        acct = OAuthAccount(provider="google", subject=sub, email=email, user_id=user_id)
        db.add(acct)
    else:
        # Re-bind in case the user re-connects from another account
        acct.user_id = user_id
        acct.email = email or acct.email

    acct.access_token = token_payload.get("access_token")
    # Google only returns a refresh_token on first consent (or when prompt=consent).
    if token_payload.get("refresh_token"):
        acct.refresh_token = token_payload["refresh_token"]
    acct.token_expires_at = expires_at
    acct.scopes = token_payload.get("scope") or CALENDAR_SCOPE

    db.commit()
    db.refresh(acct)
    return acct


def get_calendar_account(db: Session, user_id: int) -> Optional[OAuthAccount]:
    return (
        db.query(OAuthAccount)
        .filter(
            OAuthAccount.user_id == user_id,
            OAuthAccount.provider == "google",
            OAuthAccount.refresh_token.isnot(None),
        )
        .first()
    )


def get_valid_access_token(db: Session, acct: OAuthAccount) -> str:
    """Return a non-expired access token, refreshing it if needed."""
    if not acct.refresh_token:
        raise HTTPException(401, "Google Calendar no está conectado.")

    needs_refresh = (
        not acct.access_token
        or not acct.token_expires_at
        or acct.token_expires_at <= datetime.utcnow()
    )
    if not needs_refresh:
        return acct.access_token

    payload = refresh_access_token(acct.refresh_token)
    acct.access_token = payload.get("access_token")
    expires_in = int(payload.get("expires_in", 3600))
    acct.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in - 60)
    db.commit()
    return acct.access_token


# ── Calendar API ─────────────────────────────────────────────────────────────
def _event_body(
    summary: str,
    fecha: date,
    description: str,
    *,
    attendees: Optional[List[str]] = None,
    include_meet: bool = False,
) -> dict:
    """All-day event on `fecha`. Optionally invites attendees and attaches a Meet link."""
    next_day = fecha + timedelta(days=1)
    body: dict = {
        "summary": summary,
        "description": description,
        "start": {"date": fecha.isoformat()},
        "end": {"date": next_day.isoformat()},
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup", "minutes": 60 * 24},      # 1 day before
                {"method": "popup", "minutes": 60 * 24 * 3},  # 3 days before
            ],
        },
    }
    if attendees:
        body["attendees"] = [{"email": e} for e in attendees if e]
    if include_meet:
        body["conferenceData"] = {
            "createRequest": {
                "requestId": uuid.uuid4().hex,
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        }
    return body


def _calendar_request(
    method: str,
    path: str,
    access_token: str,
    json: Optional[dict] = None,
    *,
    extra_params: Optional[dict] = None,
):
    url = f"{CALENDAR_API}{path}"
    if extra_params:
        url = f"{url}?{urlencode(extra_params)}"
    return _requests().request(
        method,
        url,
        headers={"Authorization": f"Bearer {access_token}"},
        json=json,
        timeout=15,
    )


def upsert_event(
    db: Session,
    user_id: int,
    *,
    existing_event_id: Optional[str],
    summary: str,
    fecha: date,
    description: str,
    attendees: Optional[List[str]] = None,
    include_meet: bool = False,
) -> str:
    """Create or update the event; returns the Google event id."""
    acct = get_calendar_account(db, user_id)
    if not acct:
        raise HTTPException(401, "Google Calendar no está conectado.")
    token = get_valid_access_token(db, acct)
    body = _event_body(summary, fecha, description, attendees=attendees, include_meet=include_meet)
    params: dict = {}
    if include_meet:
        params["conferenceDataVersion"] = 1
    if attendees:
        # `sendUpdates=all` sends them the invite by email.
        params["sendUpdates"] = "all"

    if existing_event_id:
        resp = _calendar_request(
            "PATCH",
            f"/calendars/primary/events/{existing_event_id}",
            token,
            json=body,
            extra_params=params or None,
        )
        if resp.status_code == 404:
            # event was deleted on Google's side — fall through to create
            existing_event_id = None
        elif resp.status_code >= 400:
            logger.warning("Calendar PATCH error %s: %s", resp.status_code, resp.text)
            raise HTTPException(502, "Google Calendar rechazó la actualización.")
        else:
            return resp.json()["id"]

    resp = _calendar_request(
        "POST",
        "/calendars/primary/events",
        token,
        json=body,
        extra_params=params or None,
    )
    if resp.status_code >= 400:
        logger.warning("Calendar POST error %s: %s", resp.status_code, resp.text)
        raise HTTPException(502, "Google Calendar rechazó el evento.")
    return resp.json()["id"]


def get_team_emails(db: Session, org_id: Optional[int]) -> List[str]:
    """Pull the org's configured team_emails (used as attendees on every event)."""
    if not org_id:
        return []
    from app.models.organization import Organization
    org = db.get(Organization, org_id)
    if not org or not org.team_emails:
        return []
    raw = org.team_emails
    if isinstance(raw, list):
        return [str(e).strip() for e in raw if str(e).strip()]
    if isinstance(raw, str):
        return [e.strip() for e in raw.split(",") if e.strip()]
    return []


def delete_event(db: Session, user_id: int, event_id: str) -> None:
    acct = get_calendar_account(db, user_id)
    if not acct:
        return  # already disconnected, nothing to do
    token = get_valid_access_token(db, acct)
    resp = _calendar_request("DELETE", f"/calendars/primary/events/{event_id}", token)
    # 404/410 → event already gone; treat as success
    if resp.status_code not in (200, 204, 404, 410):
        logger.warning("Calendar DELETE error %s: %s", resp.status_code, resp.text)
        raise HTTPException(502, "No se pudo borrar el evento en Google Calendar.")


def disconnect(db: Session, user_id: int) -> None:
    acct = get_calendar_account(db, user_id)
    if not acct:
        return
    acct.access_token = None
    acct.refresh_token = None
    acct.token_expires_at = None
    acct.scopes = None
    db.commit()
