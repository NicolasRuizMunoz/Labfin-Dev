from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.dependencies.auth import get_current_user, UserTokenData
from app.schemas.chat import (
    ChatMessageCreate, ChatMessageResponse, ChatSessionCreate, ChatSessionResponse, ChatSource,
)
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["Chat"])


def _require_org(current_user: UserTokenData) -> int:
    if current_user.organization_id is None:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    return int(current_user.organization_id)


def _msg_response(m) -> ChatMessageResponse:
    sources: List[ChatSource] = []
    if m.sources_json:
        for s in m.sources_json:
            sources.append(ChatSource(
                file_id=s.get("file_id"),
                file_name=s.get("file_name"),
                page=s.get("page"),
                score=s.get("score"),
                fragment=s.get("fragment", ""),
                uri=s.get("uri", ""),
                s3_key_processed=s.get("s3_key_processed"),
            ))
    return ChatMessageResponse(
        id=m.id, role=m.role, message=m.message, sources=sources, created_at=m.created_at,
    )


# ---- Sessions ----

@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(
    payload: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    session = chat_service.create_session(
        db, organization_id=_require_org(current_user), user_id=current_user.user_id, title=payload.title,
    )
    return ChatSessionResponse.model_validate(session, from_attributes=True)


@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    sessions = chat_service.list_sessions(
        db, organization_id=_require_org(current_user), user_id=current_user.user_id,
        limit=limit, offset=offset,
    )
    return [ChatSessionResponse.model_validate(s, from_attributes=True) for s in sessions]


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    session = chat_service.get_session_owned(
        db, session_id=session_id, organization_id=_require_org(current_user), user_id=current_user.user_id,
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return ChatSessionResponse.model_validate(session, from_attributes=True)


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    session = chat_service.get_session_owned(
        db, session_id=session_id, organization_id=_require_org(current_user), user_id=current_user.user_id,
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    chat_service.delete_session(db, session=session)


# ---- Messages ----

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def list_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    asc: bool = Query(True),
):
    session = chat_service.get_session_owned(
        db, session_id=session_id, organization_id=_require_org(current_user), user_id=current_user.user_id,
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    msgs = chat_service.list_messages(db, session=session, limit=limit, offset=offset, ascending=asc)
    return [_msg_response(m) for m in msgs]


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
def post_message(
    session_id: int,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: UserTokenData = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    session = chat_service.get_session_owned(
        db, session_id=session_id, organization_id=org_id, user_id=current_user.user_id,
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    chat_service.add_message(db, session=session, role="user", message=payload.message)

    assistant_text, assistant_sources = chat_service.generate_assistant_reply(
        db=db,
        user_message=payload.message,
        organization_id=org_id,
        user_id=current_user.user_id,
        session_id=session.id,
    )

    assistant_msg = chat_service.add_message(
        db, session=session, role="assistant", message=assistant_text, sources=assistant_sources,
    )
    return _msg_response(assistant_msg)
