from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import UserTokenData, get_current_user, require_org
from app.models.organization import Organization

router = APIRouter(prefix="/organizations", tags=["Organizations"])


class OrgSettingsResponse(BaseModel):
    id: int
    name: str
    team_emails: List[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class OrgSettingsUpdate(BaseModel):
    team_emails: Optional[List[EmailStr]] = None



def _emails_to_list(raw) -> List[str]:
    if isinstance(raw, list):
        return [str(e).strip() for e in raw if str(e).strip()]
    if isinstance(raw, str):
        return [e.strip() for e in raw.split(",") if e.strip()]
    return []


@router.get("/me", response_model=OrgSettingsResponse)
def get_my_org(
    db: Session = Depends(get_db),
    current: UserTokenData = Depends(get_current_user),
):
    org_id = require_org(current)
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organización no encontrada")
    return OrgSettingsResponse(
        id=org.id,
        name=org.name,
        team_emails=_emails_to_list(org.team_emails),
    )


@router.patch("/me", response_model=OrgSettingsResponse)
def update_my_org(
    data: OrgSettingsUpdate,
    db: Session = Depends(get_db),
    current: UserTokenData = Depends(get_current_user),
):
    org_id = require_org(current)
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organización no encontrada")
    if data.team_emails is not None:
        org.team_emails = [str(e) for e in data.team_emails]
    db.commit()
    db.refresh(org)
    return OrgSettingsResponse(
        id=org.id,
        name=org.name,
        team_emails=_emails_to_list(org.team_emails),
    )
