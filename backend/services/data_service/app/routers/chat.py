# app/routers/chat_routes.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import get_current_user_data
from app.routers.schemas.auth import UserTokenData
from app.routers.schemas.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSource,
)
from app.services import chat_service

router = APIRouter()

# --------- Helpers ---------

def _require_org_id(current_user: UserTokenData) -> int:
    org_id = current_user.organization_id
    if org_id is None:
        raise HTTPException(status_code=403, detail="El usuario no pertenece a una organización")
    try:
        return int(org_id)
    except Exception:
        raise HTTPException(status_code=401, detail="organization_id inválido")

def _user_id_from_sub(current_user: UserTokenData) -> int:
    """
    Convierte sub → int. Si no es numérico, devuelve 401 para mantener consistencia
    con el resto de routers que esperan IDs numéricos.
    """
    sub = str(current_user.sub)
    if not sub.isdigit():
        raise HTTPException(status_code=401, detail="Token inválido: sub no numérico")
    return int(sub)

def _to_chat_message_response(m) -> ChatMessageResponse:
    # sources_json -> List[ChatSource]
    sources: List[ChatSource] = []
    if m.sources_json:
        for s in m.sources_json:
            sources.append(ChatSource(
                file_id=s.get("file_id"),
                file_name=s.get("file_name"),
                page=s.get("page"),
                score=s.get("score"),
            ))
    return ChatMessageResponse(
        id=m.id,
        role=m.role,  # Literal["user","assistant"]
        message=m.message,
        sources=sources,
        created_at=m.created_at,
    )

# --------- Sesiones ---------

@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(
    payload: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = _require_org_id(current_user)
    user_id = _user_id_from_sub(current_user)

    session = chat_service.create_session(
        db,
        organization_id=org_id,
        user_id=user_id,
        title=payload.title,
    )
    return ChatSessionResponse.model_validate(session, from_attributes=True)

@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    org_id = _require_org_id(current_user)
    user_id = _user_id_from_sub(current_user)

    sessions = chat_service.list_sessions(db, organization_id=org_id, user_id=user_id, limit=limit, offset=offset)
    return [ChatSessionResponse.model_validate(s, from_attributes=True) for s in sessions]

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = _require_org_id(current_user)
    user_id = _user_id_from_sub(current_user)

    session = chat_service.get_session_owned(db, session_id=session_id, organization_id=org_id, user_id=user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return ChatSessionResponse.model_validate(session, from_attributes=True)

@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    org_id = _require_org_id(current_user)
    user_id = _user_id_from_sub(current_user)

    session = chat_service.get_session_owned(db, session_id=session_id, organization_id=org_id, user_id=user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    chat_service.delete_session(db, session=session)
    return

# --------- Mensajes ---------

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def list_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    asc: bool = Query(True),
):
    org_id = _require_org_id(current_user)
    user_id = _user_id_from_sub(current_user)

    session = chat_service.get_session_owned(db, session_id=session_id, organization_id=org_id, user_id=user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    msgs = chat_service.list_messages(db, session=session, limit=limit, offset=offset, ascending=asc)
    return [_to_chat_message_response(m) for m in msgs]

@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
def post_user_message(
    session_id: int,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user_data),
):
    """
    Crea el mensaje del usuario y devuelve la respuesta del asistente.
    """
    org_id = _require_org_id(current_user)
    user_id = _user_id_from_sub(current_user)

    session = chat_service.get_session_owned(db, session_id=session_id, organization_id=org_id, user_id=user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    # 1) Guardar mensaje del usuario
    chat_service.add_message(
        db,
        session=session,
        role="user",
        message=payload.message,
        sources=None,
    )

    # 2) Llamar a tu orquestador/LLM
    assistant_text, assistant_sources = chat_service.generate_assistant_reply(
        user_message=payload.message,
        organization_id=org_id,
        user_id=user_id,
        session_id=session.id,
    )

    # 3) Guardar respuesta del asistente
    assistant_msg = chat_service.add_message(
        db,
        session=session,
        role="assistant",
        message=assistant_text,
        sources=assistant_sources,
    )

    return _to_chat_message_response(assistant_msg)
