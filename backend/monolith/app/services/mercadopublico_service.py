"""MercadoPúblico (Chile) public-procurement API client + sync orchestrator.

The API is documented at https://desarrolladores.mercadopublico.cl.
Endpoint shape (one URL, switched by query params):
  - List:   GET .../licitaciones.json?ticket=XXX&estado=publicada
  - Detail: GET .../licitaciones.json?ticket=XXX&codigo=1234-56-LE25

This module never raises on transport errors — it logs and returns empty results
so the scheduler can keep running across days.
"""
from __future__ import annotations

import logging
import threading
import time
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from typing import List, Optional

from sqlalchemy.orm import Session

from app.config import MP_API_BASE_URL, MP_API_TICKET, MP_DESCUBRIR_DIAS
from app.models.etiqueta_busqueda import EtiquetaBusqueda
from app.models.licitacion import Licitacion

logger = logging.getLogger(__name__)

MP_DETAIL_URL_TEMPLATE = (
    "https://www.mercadopublico.cl/Procurement/Modules/RFB/"
    "DetailsAcquisition.aspx?idlicitacion={codigo}"
)


def _requests():
    try:
        import requests  # noqa: WPS433
    except ImportError as exc:
        raise RuntimeError("Falta dependencia 'requests'.") from exc
    return requests


# MercadoPúblico penaliza ráfagas con 429 ("peticiones simultáneas"). Serializamos
# y espaciamos todas las llamadas con un lock global + intervalo mínimo, y
# reintentamos con backoff exponencial ante un 429.
_MP_MIN_INTERVAL = 1.2   # segundos mínimos entre llamadas
_MP_MAX_RETRIES = 4
_last_call_ts = 0.0
_call_lock = threading.Lock()


def _throttle() -> None:
    global _last_call_ts
    with _call_lock:
        wait = _MP_MIN_INTERVAL - (time.monotonic() - _last_call_ts)
        if wait > 0:
            time.sleep(wait)
        _last_call_ts = time.monotonic()


def _api_get(params: dict, timeout: int = 30) -> Optional[dict]:
    if not MP_API_TICKET:
        logger.warning("MP_API_TICKET no configurado — el scraper de MercadoPúblico está deshabilitado.")
        return None
    url = MP_API_BASE_URL
    full_params = {**params, "ticket": MP_API_TICKET}
    backoff = 2.0
    for attempt in range(_MP_MAX_RETRIES):
        _throttle()
        try:
            resp = _requests().get(url, params=full_params, timeout=timeout)
        except Exception as exc:  # noqa: BLE001 — errores de transporte
            logger.warning("MP API error de transporte: %s", exc)
            return None
        if resp.status_code == 200:
            try:
                return resp.json()
            except ValueError:
                logger.warning("MP API devolvió contenido no-JSON: %s", resp.text[:200])
                return None
        if resp.status_code == 429:
            logger.warning(
                "MP API 429 (rate limit), intento %s/%s — esperando %.0fs",
                attempt + 1, _MP_MAX_RETRIES, backoff,
            )
            time.sleep(backoff)
            backoff *= 2
            continue
        logger.warning("MP API %s -> %s: %s", url, resp.status_code, resp.text[:200])
        return None
    logger.warning("MP API: agotados los reintentos por rate limit (429).")
    return None


def _fecha_mp(d: date) -> str:
    """MercadoPúblico espera la fecha como ddmmaaaa."""
    return d.strftime("%d%m%Y")


def fetch_listado(estado: Optional[str] = None, fecha: Optional[date] = None) -> List[dict]:
    params: dict = {}
    if estado is not None:
        params["estado"] = estado
    if fecha is not None:
        params["fecha"] = _fecha_mp(fecha)
    data = _api_get(params)
    if not data:
        return []
    return data.get("Listado") or []


def fetch_detail(codigo: str) -> Optional[dict]:
    data = _api_get({"codigo": codigo})
    if not data:
        return None
    listado = data.get("Listado") or []
    return listado[0] if listado else None


# ── parsers ──────────────────────────────────────────────────────────────────
def _parse_date(value) -> Optional[date]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    s = str(value).strip()
    if not s:
        return None
    # MP usually returns ISO ("2026-06-12T15:00:00") but tolerate dd-mm-yyyy.
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(s[: len(fmt) + 2], fmt).date()
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(s.replace("Z", "")).date()
    except ValueError:
        return None


def _to_decimal(value) -> Optional[Decimal]:
    if value in (None, "", 0, "0"):
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


def _extract_categoria(items) -> Optional[str]:
    """`Items` shape varies: dict with Listado, or list, or absent."""
    if isinstance(items, dict):
        listado = items.get("Listado") or []
        first = listado[0] if listado else None
        return first.get("Categoria") if first else None
    if isinstance(items, list) and items:
        return items[0].get("Categoria") if isinstance(items[0], dict) else None
    return None


def normalize_detail(detail: dict) -> dict:
    """Map a MercadoPúblico detail payload to our Licitacion fields."""
    fechas = detail.get("Fechas") or {}
    comprador = detail.get("Comprador") or {}
    codigo = detail.get("CodigoExterno")
    # MP exposes the question/answer deadline under a couple of historical names.
    fecha_preguntas_raw = (
        fechas.get("FechaFinalPreguntas")
        or fechas.get("FechaFinPlazoPreguntas")
        or fechas.get("FechaPreguntas")
        or fechas.get("FechaFinalPlazoPreguntas")
    )
    return {
        "codigo_externo": codigo,
        "nombre": (detail.get("Nombre") or "")[:255],
        "descripcion": detail.get("Descripcion"),
        "fecha_vencimiento": _parse_date(fechas.get("FechaCierre")),
        "fecha_vencimiento_preguntas": _parse_date(fecha_preguntas_raw),
        "organismo": ((comprador.get("NombreOrganismo") or "")[:255]) or None,
        "region": ((comprador.get("RegionUnidad") or "")[:100]) or None,
        "monto_estimado": _to_decimal(detail.get("MontoEstimado")),
        "moneda": ((detail.get("Moneda") or "")[:10]) or None,
        "categoria": ((_extract_categoria(detail.get("Items")) or "")[:255]) or None,
        "estado_mp": ((detail.get("Estado") or "")[:50]) or None,
        "link_externo": MP_DETAIL_URL_TEMPLATE.format(codigo=codigo) if codigo else None,
    }


# ── matching ─────────────────────────────────────────────────────────────────
def _matches_etiqueta(payload: dict, etiqueta: EtiquetaBusqueda) -> bool:
    """True if the licitacion payload satisfies every set filter in the etiqueta."""
    text = " ".join([
        payload.get("nombre") or "",
        payload.get("descripcion") or "",
        payload.get("categoria") or "",
    ]).lower()

    keywords = etiqueta.keywords or []
    if keywords and not any(kw.lower() in text for kw in keywords if kw):
        return False

    regiones = etiqueta.regiones or []
    if regiones:
        region = (payload.get("region") or "").lower()
        if not any(r.lower() in region for r in regiones if r):
            return False

    categorias = etiqueta.categorias or []
    if categorias:
        cat = (payload.get("categoria") or "").lower()
        if not any(c.lower() in cat for c in categorias if c):
            return False

    monto = payload.get("monto_estimado")
    if etiqueta.monto_min is not None:
        if monto is None or monto < Decimal(etiqueta.monto_min):
            return False
    if etiqueta.monto_max is not None:
        if monto is None or monto > Decimal(etiqueta.monto_max):
            return False
    return True


# ── upsert ───────────────────────────────────────────────────────────────────
_REMOTE_FIELDS = (
    "nombre", "descripcion", "fecha_vencimiento", "fecha_vencimiento_preguntas",
    "organismo", "region", "monto_estimado", "moneda", "categoria",
    "estado_mp", "link_externo",
)


def _upsert_licitacion(db: Session, org_id: int, payload: dict) -> tuple[Licitacion, bool]:
    codigo = payload.get("codigo_externo")
    if not codigo:
        raise ValueError("Payload sin CodigoExterno")

    lic = (
        db.query(Licitacion)
        .filter(Licitacion.organization_id == org_id, Licitacion.codigo_externo == codigo)
        .first()
    )
    created = False
    if not lic:
        lic = Licitacion(
            organization_id=org_id,
            nombre=payload.get("nombre") or codigo,
            codigo_externo=codigo,
            fuente="mercadopublico",
        )
        db.add(lic)
        created = True

    for field in _REMOTE_FIELDS:
        value = payload.get(field)
        if value is not None:
            setattr(lic, field, value)
    return lic, created


# ── lightweight upsert (discovery, listing-only) ──────────────────────────────
_MP_ESTADOS = {
    5: "publicada",
    6: "cerrada",
    7: "desierta",
    8: "adjudicada",
    18: "revocada",
    19: "suspendida",
}


def _estado_nombre(code) -> Optional[str]:
    try:
        return _MP_ESTADOS.get(int(code), f"estado_{int(code)}")
    except (TypeError, ValueError):
        return None


def _upsert_listado_item(db: Session, org_id: int, item: dict) -> tuple[Licitacion, bool]:
    """Upsert usando solo los datos del listado (sin bajar el detalle)."""
    codigo = item.get("CodigoExterno")
    if not codigo:
        raise ValueError("Item de listado sin CodigoExterno")

    lic = (
        db.query(Licitacion)
        .filter(Licitacion.organization_id == org_id, Licitacion.codigo_externo == codigo)
        .first()
    )
    created = False
    if not lic:
        lic = Licitacion(
            organization_id=org_id,
            nombre=(item.get("Nombre") or codigo)[:255],
            codigo_externo=codigo,
            fuente="mercadopublico",
        )
        db.add(lic)
        created = True

    if item.get("Nombre"):
        lic.nombre = item["Nombre"][:255]
    fc = _parse_date(item.get("FechaCierre"))
    if fc:
        lic.fecha_vencimiento = fc
    estado_txt = _estado_nombre(item.get("CodigoEstado"))
    if estado_txt:
        lic.estado_mp = estado_txt
    lic.link_externo = MP_DETAIL_URL_TEMPLATE.format(codigo=codigo)
    return lic, created


# ── orchestrators ────────────────────────────────────────────────────────────
def sincronizar_para_org(db: Session, org_id: int, dias_atras: Optional[int] = None) -> dict:
    """Modo targeted: recorre las publicadas de los últimos `dias_atras` días
    (por fecha de publicación), baja el detalle de las que pasan el pre-filtro por
    keyword y hace upsert de las que matchean alguna etiqueta activa."""
    dias = dias_atras if dias_atras is not None else MP_DESCUBRIR_DIAS
    etiquetas = (
        db.query(EtiquetaBusqueda)
        .filter(
            EtiquetaBusqueda.organization_id == org_id,
            EtiquetaBusqueda.activa.is_(True),
        )
        .all()
    )
    result = {
        "etiquetas_evaluadas": len(etiquetas),
        "licitaciones_revisadas": 0,
        "licitaciones_nuevas": 0,
        "licitaciones_actualizadas": 0,
        "errores": [],
    }
    if not etiquetas:
        return result

    # Cheap pre-filter against the listing's `Nombre` to avoid hitting the
    # detail endpoint for everything (MP returns ~1k items/day).
    pre_filter = [k.lower() for e in etiquetas for k in (e.keywords or []) if k]
    seen: set[str] = set()
    hoy = date.today()

    for offset in range(dias + 1):
        listado = fetch_listado(fecha=hoy - timedelta(days=offset))
        for item in listado:
            codigo = item.get("CodigoExterno")
            if not codigo or codigo in seen:
                continue
            seen.add(codigo)
            if _estado_nombre(item.get("CodigoEstado")) != "publicada":
                continue
            nombre_l = (item.get("Nombre") or "").lower()
            if pre_filter and not any(kw in nombre_l for kw in pre_filter):
                continue

            detail = fetch_detail(codigo)
            if not detail:
                result["errores"].append(f"Sin detalle para {codigo}")
                continue
            payload = normalize_detail(detail)
            result["licitaciones_revisadas"] += 1

            if not any(_matches_etiqueta(payload, e) for e in etiquetas):
                continue

            try:
                _, created = _upsert_licitacion(db, org_id, payload)
                if created:
                    result["licitaciones_nuevas"] += 1
                else:
                    result["licitaciones_actualizadas"] += 1
            except Exception as exc:
                db.rollback()
                result["errores"].append(f"{codigo}: {exc}")
                continue

    db.commit()
    return result


def descubrir_para_org(
    db: Session,
    org_id: int,
    dias_atras: Optional[int] = None,
    keywords: Optional[List[str]] = None,
) -> dict:
    """Modo descubrimiento: barre TODAS las publicadas en los últimos `dias_atras`
    días (por fecha de publicación) y las guarda con datos livianos del listado
    (sin bajar el detalle de cada una). El detalle se completa on-demand al abrir
    la licitación."""
    dias = dias_atras if dias_atras is not None else MP_DESCUBRIR_DIAS
    kws = [k.lower() for k in (keywords or []) if k]
    result = {
        "dias": dias,
        "licitaciones_revisadas": 0,
        "licitaciones_nuevas": 0,
        "licitaciones_actualizadas": 0,
        "errores": [],
    }
    hoy = date.today()
    seen: set[str] = set()

    for offset in range(dias + 1):
        listado = fetch_listado(fecha=hoy - timedelta(days=offset))
        for item in listado:
            codigo = item.get("CodigoExterno")
            if not codigo or codigo in seen:
                continue
            seen.add(codigo)
            if _estado_nombre(item.get("CodigoEstado")) != "publicada":
                continue
            if kws:
                nombre_l = (item.get("Nombre") or "").lower()
                if not any(k in nombre_l for k in kws):
                    continue
            result["licitaciones_revisadas"] += 1
            try:
                _, created = _upsert_listado_item(db, org_id, item)
                if created:
                    result["licitaciones_nuevas"] += 1
                else:
                    result["licitaciones_actualizadas"] += 1
            except Exception as exc:
                db.rollback()
                result["errores"].append(f"{codigo}: {exc}")
                continue

    db.commit()
    return result


def asegurar_detalle(db: Session, lic: Licitacion) -> bool:
    """Completa el detalle MP de una licitación descubierta (que solo tiene datos
    del listado). Devuelve True si bajó y guardó datos nuevos."""
    if getattr(lic, "fuente", None) != "mercadopublico" or not lic.codigo_externo:
        return False
    # ¿Ya tiene detalle? (algún campo que solo viene del detalle)
    if lic.descripcion or lic.monto_estimado is not None or lic.organismo or lic.region:
        return False
    detail = fetch_detail(lic.codigo_externo)
    if not detail:
        return False
    payload = normalize_detail(detail)
    for field in _REMOTE_FIELDS:
        value = payload.get(field)
        if value is not None:
            setattr(lic, field, value)
    db.commit()
    return True


def sincronizar_todas_las_orgs(db: Session) -> dict:
    org_ids = [
        oid for (oid,) in db.query(EtiquetaBusqueda.organization_id)
        .filter(EtiquetaBusqueda.activa.is_(True))
        .distinct()
        .all()
    ]
    totals = {"orgs": 0, "nuevas": 0, "actualizadas": 0, "errores": []}
    for org_id in org_ids:
        try:
            r = sincronizar_para_org(db, org_id)
            totals["orgs"] += 1
            totals["nuevas"] += r["licitaciones_nuevas"]
            totals["actualizadas"] += r["licitaciones_actualizadas"]
            totals["errores"].extend(r["errores"])
        except Exception as exc:
            logger.exception("Fallo sincronizando org %s", org_id)
            totals["errores"].append(f"org {org_id}: {exc}")
    return totals
