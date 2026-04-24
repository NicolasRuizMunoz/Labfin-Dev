import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.contact_email import send_demo_request_email

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Contact"])


class DemoRequest(BaseModel):
    name: str
    email: str
    phone: str = ""
    description: str = ""


@router.post("/demo-request", status_code=200)
def demo_request(payload: DemoRequest):
    try:
        send_demo_request_email(
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            description=payload.description,
        )
    except Exception:
        logger.exception("Failed to process demo request from %s", payload.email)
        raise HTTPException(status_code=500, detail="No se pudo enviar la solicitud")
    return {"ok": True}
