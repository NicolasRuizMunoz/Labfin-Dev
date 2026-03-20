"""Admin endpoints — restricted to evalitics role."""
from datetime import date, datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import require_role, UserTokenData
from app.models.token_usage import TokenUsage
from app.models.organization import Organization
from app.models.escenario import Escenario
from app.models.simulacion import Simulacion, SimulacionEscenario
from app.models.licitacion import Licitacion

router = APIRouter(tags=["Admin"])


@router.get("/token-usage/summary")
def token_usage_summary(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _current: UserTokenData = Depends(require_role("evalitics")),
):
    """
    Per-organization summary: total tokens, split by usage_type, estimated cost.
    """
    q = db.query(
        TokenUsage.organization_id,
        Organization.name.label("organization_name"),
        TokenUsage.usage_type,
        func.sum(TokenUsage.prompt_tokens).label("prompt_tokens"),
        func.sum(TokenUsage.completion_tokens).label("completion_tokens"),
        func.sum(TokenUsage.total_tokens).label("total_tokens"),
        func.sum(TokenUsage.estimated_cost_usd).label("estimated_cost_usd"),
        func.count(TokenUsage.id).label("request_count"),
    ).join(Organization, Organization.id == TokenUsage.organization_id)

    if date_from:
        q = q.filter(TokenUsage.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        q = q.filter(TokenUsage.created_at < datetime.combine(date_to + timedelta(days=1), datetime.min.time()))

    rows = (
        q.group_by(TokenUsage.organization_id, Organization.name, TokenUsage.usage_type)
        .order_by(Organization.name, TokenUsage.usage_type)
        .all()
    )

    # Reshape into per-org objects
    orgs: dict = {}
    for r in rows:
        oid = r.organization_id
        if oid not in orgs:
            orgs[oid] = {
                "organization_id": oid,
                "organization_name": r.organization_name,
                "analysis": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost_usd": 0, "requests": 0},
                "chat": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost_usd": 0, "requests": 0},
                "scenario_analysis": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost_usd": 0, "requests": 0},
                "total_tokens": 0,
                "total_cost_usd": 0,
                "total_requests": 0,
            }
        usage_key = r.usage_type.value if hasattr(r.usage_type, 'value') else r.usage_type
        bucket = orgs[oid].get(usage_key, orgs[oid]["chat"])
        bucket["prompt_tokens"] = int(r.prompt_tokens or 0)
        bucket["completion_tokens"] = int(r.completion_tokens or 0)
        bucket["total_tokens"] = int(r.total_tokens or 0)
        bucket["cost_usd"] = float(r.estimated_cost_usd or 0)
        bucket["requests"] = int(r.request_count or 0)

    for o in orgs.values():
        o["total_tokens"] = o["analysis"]["total_tokens"] + o["chat"]["total_tokens"] + o["scenario_analysis"]["total_tokens"]
        o["total_cost_usd"] = round(o["analysis"]["cost_usd"] + o["chat"]["cost_usd"] + o["scenario_analysis"]["cost_usd"], 6)
        o["total_requests"] = o["analysis"]["requests"] + o["chat"]["requests"] + o["scenario_analysis"]["requests"]

    return list(orgs.values())


@router.get("/token-usage/detail")
def token_usage_detail(
    organization_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    _current: UserTokenData = Depends(require_role("evalitics")),
):
    """Paginated detail of individual API calls, optionally filtered by org and date range."""
    q = db.query(TokenUsage).join(Organization, Organization.id == TokenUsage.organization_id)

    if organization_id:
        q = q.filter(TokenUsage.organization_id == organization_id)
    if date_from:
        q = q.filter(TokenUsage.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        q = q.filter(TokenUsage.created_at < datetime.combine(date_to + timedelta(days=1), datetime.min.time()))

    total = q.count()
    rows = q.order_by(TokenUsage.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": r.id,
                "organization_id": r.organization_id,
                "user_id": r.user_id,
                "usage_type": r.usage_type.value if hasattr(r.usage_type, 'value') else r.usage_type,
                "model": r.model,
                "prompt_tokens": r.prompt_tokens,
                "completion_tokens": r.completion_tokens,
                "total_tokens": r.total_tokens,
                "estimated_cost_usd": float(r.estimated_cost_usd),
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ],
    }


@router.get("/escenarios")
def admin_list_escenarios(
    db: Session = Depends(get_db),
    _current: UserTokenData = Depends(require_role("evalitics")),
):
    rows = (
        db.query(Escenario, Organization.name.label("org_name"))
        .join(Organization, Organization.id == Escenario.organization_id)
        .order_by(Organization.name, Escenario.created_at.desc())
        .all()
    )
    result = []
    for esc, org_name in rows:
        sim_count = (
            db.query(func.count(SimulacionEscenario.id))
            .filter(SimulacionEscenario.escenario_id == esc.id)
            .scalar()
        ) or 0
        result.append({
            "id": esc.id,
            "organization_id": esc.organization_id,
            "organization_name": org_name,
            "nombre": esc.nombre,
            "descripcion": esc.descripcion,
            "tipo": esc.tipo,
            "simulaciones_count": sim_count,
            "created_at": esc.created_at.isoformat() if esc.created_at else None,
        })
    return result


@router.get("/simulaciones")
def admin_list_simulaciones(
    db: Session = Depends(get_db),
    _current: UserTokenData = Depends(require_role("evalitics")),
):
    rows = (
        db.query(Simulacion, Organization.name.label("org_name"), Licitacion.nombre.label("lic_nombre"))
        .join(Organization, Organization.id == Simulacion.organization_id)
        .join(Licitacion, Licitacion.id == Simulacion.licitacion_id)
        .order_by(Organization.name, Simulacion.created_at.desc())
        .all()
    )
    result = []
    for sim, org_name, lic_nombre in rows:
        esc_names = (
            db.query(Escenario.nombre)
            .join(SimulacionEscenario, SimulacionEscenario.escenario_id == Escenario.id)
            .filter(SimulacionEscenario.simulacion_id == sim.id)
            .all()
        )
        result.append({
            "id": sim.id,
            "organization_id": sim.organization_id,
            "organization_name": org_name,
            "licitacion_nombre": lic_nombre,
            "nombre": sim.nombre,
            "escenarios": [n[0] for n in esc_names],
            "is_active": sim.is_active,
            "created_at": sim.created_at.isoformat() if sim.created_at else None,
        })
    return result


@router.delete("/escenarios/{escenario_id}", status_code=204)
def admin_delete_escenario(
    escenario_id: int,
    db: Session = Depends(get_db),
    _current: UserTokenData = Depends(require_role("evalitics")),
):
    esc = db.query(Escenario).filter(Escenario.id == escenario_id).first()
    if not esc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Escenario no encontrado")
    # Admin force delete: remove from simulacion_escenarios first
    db.query(SimulacionEscenario).filter(SimulacionEscenario.escenario_id == escenario_id).delete()
    db.delete(esc)
    db.commit()


@router.delete("/simulaciones/{simulacion_id}", status_code=204)
def admin_delete_simulacion(
    simulacion_id: int,
    db: Session = Depends(get_db),
    _current: UserTokenData = Depends(require_role("evalitics")),
):
    sim = db.query(Simulacion).filter(Simulacion.id == simulacion_id).first()
    if not sim:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Simulación no encontrada")
    db.delete(sim)
    db.commit()
