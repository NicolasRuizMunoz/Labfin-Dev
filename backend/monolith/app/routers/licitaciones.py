from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import get_current_user, UserTokenData
from app.schemas.licitacion import LicitacionCreate, LicitacionUpdate, LicitacionResponse
from app.schemas.file import FileEntryResponse
from app.schemas.analisis_licitacion import AnalisisLicitacionResponse
from app.services import licitacion_service, file_service, analysis_service
from app.services import google_calendar_service as gcal


class CalendarSyncOptions(BaseModel):
    include_meet: bool = False

router = APIRouter(prefix="/licitacion", tags=["Licitaciones"])


def _require_org(current_user: UserTokenData) -> int:
    if current_user.organization_id is None:
        raise HTTPException(status_code=403, detail="El usuario no pertenece a ninguna organización")
    return int(current_user.organization_id)


@router.post("/", response_model=LicitacionResponse, status_code=status.HTTP_201_CREATED)
def create_licitacion(
    data: LicitacionCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return licitacion_service.create(db, current_user.organization_id, data)


@router.get("/", response_model=List[LicitacionResponse])
def list_licitaciones(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return licitacion_service.get_all(db, current_user.organization_id)


@router.get("/{lic_id}", response_model=LicitacionResponse)
def get_licitacion(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    return licitacion_service.get_one(db, current_user.organization_id, lic_id)


@router.get("/{lic_id}/files", response_model=List[FileEntryResponse])
def list_licitacion_files(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    licitacion_service.get_one(db, org_id, lic_id)
    return file_service.get_files_by_licitacion(db, org_id, lic_id)


@router.get("/{lic_id}/analisis", response_model=List[AnalisisLicitacionResponse])
def get_analisis_history(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    licitacion_service.get_one(db, org_id, lic_id)
    return analysis_service.get_analisis_history(db, org_id, lic_id)


@router.post("/{lic_id}/analizar", response_model=dict)
def analizar_licitacion(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    return analysis_service.analyze_licitacion(db, org_id, lic_id, user_id=current_user.user_id)


@router.patch("/{lic_id}", response_model=LicitacionResponse)
def update_licitacion(
    lic_id: int,
    data: LicitacionUpdate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    lic = licitacion_service.update(db, current_user.organization_id, lic_id, data)
    attendees = gcal.get_team_emails(db, current_user.organization_id)
    # Keep linked calendar events in sync transparently.
    if lic.google_calendar_event_id and lic.fecha_vencimiento:
        try:
            new_id = gcal.upsert_event(
                db,
                current_user.user_id,
                existing_event_id=lic.google_calendar_event_id,
                summary=f"Cierre licitación: {lic.nombre}",
                fecha=lic.fecha_vencimiento,
                description=f"Recordatorio de cierre de la licitación '{lic.nombre}'.",
                attendees=attendees,
            )
            lic.google_calendar_event_id = new_id
            db.commit()
        except HTTPException:
            pass
    if lic.google_calendar_event_id_preguntas and lic.fecha_vencimiento_preguntas:
        try:
            new_id = gcal.upsert_event(
                db,
                current_user.user_id,
                existing_event_id=lic.google_calendar_event_id_preguntas,
                summary=f"Vence plazo de preguntas: {lic.nombre}",
                fecha=lic.fecha_vencimiento_preguntas,
                description=f"Cierre del plazo de preguntas y aclaraciones para '{lic.nombre}'.",
                attendees=attendees,
            )
            lic.google_calendar_event_id_preguntas = new_id
            db.commit()
        except HTTPException:
            pass
    return lic


@router.delete("/{lic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_licitacion(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    # Best-effort: remove linked calendar events if any
    lic = licitacion_service.get_one(db, current_user.organization_id, lic_id)
    for event_id in filter(None, (lic.google_calendar_event_id, lic.google_calendar_event_id_preguntas)):
        try:
            gcal.delete_event(db, current_user.user_id, event_id)
        except HTTPException:
            pass
    licitacion_service.delete(db, current_user.organization_id, lic_id)


# ── Google Calendar sync ─────────────────────────────────────────────────────

@router.post("/{lic_id}/calendar/sync")
def sync_calendar_event(
    lic_id: int,
    options: Optional[CalendarSyncOptions] = None,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    """Create or update a Google Calendar event for this licitacion's fecha_vencimiento."""
    lic = licitacion_service.get_one(db, current_user.organization_id, lic_id)
    if not lic.fecha_vencimiento:
        raise HTTPException(400, "La licitación no tiene fecha de vencimiento.")

    summary = f"Cierre licitación: {lic.nombre}"
    description = (
        f"Recordatorio de cierre de la licitación '{lic.nombre}'.\n"
        f"Generado automáticamente por LabFin."
    )
    event_id = gcal.upsert_event(
        db,
        current_user.user_id,
        existing_event_id=lic.google_calendar_event_id,
        summary=summary,
        fecha=lic.fecha_vencimiento,
        description=description,
        attendees=gcal.get_team_emails(db, current_user.organization_id),
        include_meet=bool(options and options.include_meet),
    )
    lic.google_calendar_event_id = event_id
    db.commit()
    return {"event_id": event_id}


@router.delete("/{lic_id}/calendar/sync", status_code=status.HTTP_204_NO_CONTENT)
def remove_calendar_event(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    lic = licitacion_service.get_one(db, current_user.organization_id, lic_id)
    if lic.google_calendar_event_id:
        gcal.delete_event(db, current_user.user_id, lic.google_calendar_event_id)
        lic.google_calendar_event_id = None
        db.commit()


# ── Fecha de preguntas: sync independiente ────────────────────────────────────

@router.post("/{lic_id}/calendar/sync-preguntas")
def sync_calendar_event_preguntas(
    lic_id: int,
    options: Optional[CalendarSyncOptions] = None,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    """Create or update a Calendar event for the question/clarification deadline."""
    lic = licitacion_service.get_one(db, current_user.organization_id, lic_id)
    if not lic.fecha_vencimiento_preguntas:
        raise HTTPException(400, "La licitación no tiene fecha de vencimiento de preguntas.")
    summary = f"Vence plazo de preguntas: {lic.nombre}"
    description = (
        f"Cierre del plazo de preguntas y aclaraciones para '{lic.nombre}'.\n"
        f"Generado automáticamente por LabFin."
    )
    event_id = gcal.upsert_event(
        db,
        current_user.user_id,
        existing_event_id=lic.google_calendar_event_id_preguntas,
        summary=summary,
        fecha=lic.fecha_vencimiento_preguntas,
        description=description,
        attendees=gcal.get_team_emails(db, current_user.organization_id),
        include_meet=bool(options and options.include_meet),
    )
    lic.google_calendar_event_id_preguntas = event_id
    db.commit()
    return {"event_id": event_id}


@router.delete("/{lic_id}/calendar/sync-preguntas", status_code=status.HTTP_204_NO_CONTENT)
def remove_calendar_event_preguntas(
    lic_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    lic = licitacion_service.get_one(db, current_user.organization_id, lic_id)
    if lic.google_calendar_event_id_preguntas:
        gcal.delete_event(db, current_user.user_id, lic.google_calendar_event_id_preguntas)
        lic.google_calendar_event_id_preguntas = None
        db.commit()
