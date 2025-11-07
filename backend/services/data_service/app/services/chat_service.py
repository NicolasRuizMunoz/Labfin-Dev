# app/services/chat_service.py
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from app.models.chat import ChatSession, ChatMessage  # ajusta import si tu ruta difiere
from app.routers.schemas.chat import ChatSource

# ------------ Sesiones ------------

def create_session(db: Session, *, organization_id: int, user_id: int, title: Optional[str]) -> ChatSession:
    session = ChatSession(
        organization_id=organization_id,
        user_id=user_id,
        title=title or "Nueva Conversación",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def get_session_owned(db: Session, *, session_id: int, organization_id: int, user_id: int) -> Optional[ChatSession]:
    return (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.organization_id == organization_id,
            ChatSession.user_id == user_id,
        )
        .first()
    )

def list_sessions(db: Session, *, organization_id: int, user_id: int, limit: int = 50, offset: int = 0) -> List[ChatSession]:
    return (
        db.query(ChatSession)
        .filter(
            ChatSession.organization_id == organization_id,
            ChatSession.user_id == user_id,
        )
        .order_by(desc(ChatSession.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

def delete_session(db: Session, *, session: ChatSession) -> None:
    db.delete(session)
    db.commit()

# ------------ Mensajes ------------

def add_message(
    db: Session,
    *,
    session: ChatSession,
    role: str,                 # "user" | "assistant"
    message: str,
    sources: Optional[List[ChatSource]] = None,
) -> ChatMessage:
    sources_json: Optional[List[Dict[str, Any]]] = None
    if sources:
        # Convertimos a JSON primitivo
        sources_json = [s.model_dump() if hasattr(s, "model_dump") else dict(s) for s in sources]

    msg = ChatMessage(
        session_id=session.id,
        role=role,
        message=message,
        sources_json=sources_json,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

def list_messages(
    db: Session,
    *,
    session: ChatSession,
    limit: int = 100,
    offset: int = 0,
    ascending: bool = True,
) -> List[ChatMessage]:
    q = db.query(ChatMessage).filter(ChatMessage.session_id == session.id)
    q = q.order_by(asc(ChatMessage.created_at) if ascending else desc(ChatMessage.created_at))
    return q.offset(offset).limit(limit).all()

# ------------ Integración LLM (stub listo para n8n/worker) ------------

def generate_assistant_reply(
    *,
    user_message: str,
    organization_id: int,
    user_id: int,
    session_id: int,
) -> Tuple[str, List[ChatSource]]:
    """
    Punto único de integración para tu orquestador (n8n / Celery / endpoint LLM).
    - Aquí puedes llamar vía httpx a n8n, u encolar una tarea Celery.
    - Debe devolver (texto_respuesta, fuentes).
    """
    # TODO: Reemplazar por integración real
    dummy_text = "Entendido. Estoy procesando tu consulta sobre documentos tributarios."
    dummy_sources: List[ChatSource] = []
    return dummy_text, dummy_sources
