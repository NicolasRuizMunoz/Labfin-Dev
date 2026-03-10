import asyncio
import logging
from typing import List, Optional, Tuple, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatSource
from app.services.file_service import get_file_by_id_raw
from app.services.vector_store_faiss import FaissStore
from app.services.embedding import get_embedder
from app.services.rag.rag_service import generate_answer

LOGGER = logging.getLogger(__name__)


# ------------ Sessions ------------

def create_session(db: Session, *, organization_id: int, user_id: int, title: Optional[str]) -> ChatSession:
    session = ChatSession(organization_id=organization_id, user_id=user_id, title=title or "Nueva Conversación")
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
        .filter(ChatSession.organization_id == organization_id, ChatSession.user_id == user_id)
        .order_by(desc(ChatSession.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )


def delete_session(db: Session, *, session: ChatSession) -> None:
    db.delete(session)
    db.commit()


# ------------ Messages ------------

def add_message(
    db: Session,
    *,
    session: ChatSession,
    role: str,
    message: str,
    sources: Optional[List[ChatSource]] = None,
) -> ChatMessage:
    sources_json = None
    if sources:
        sources_json = [s.model_dump() if hasattr(s, "model_dump") else dict(s) for s in sources]
    msg = ChatMessage(session_id=session.id, role=role, message=message, sources_json=sources_json)
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


# ------------ RAG reply ------------

def _dedupe(results: List[Tuple[float, dict]]) -> List[Tuple[float, dict]]:
    seen, deduped = set(), []
    for score, meta in results:
        key = meta.get("s3_key_processed") or f"file:{meta.get('file_id')}"
        if key not in seen:
            seen.add(key)
            deduped.append((score, meta))
    return deduped


def generate_assistant_reply(
    *,
    db: Session,
    user_message: str,
    organization_id: int,
    user_id: int,
    session_id: int,
) -> Tuple[str, List[ChatSource]]:
    embedder = get_embedder()
    qvec = embedder.embed_query(user_message)

    store = FaissStore(org_id=organization_id, dim=embedder.dim)
    results = store.search(qvec, top_k=5)
    if not results:
        return "No relevant fragments found for your query.", []

    results = _dedupe(results)

    sources: List[ChatSource] = []
    for score, meta in results:
        file_id = int(meta.get("file_id"))
        s3_key_processed = meta.get("s3_key_processed")
        fragment = (meta.get("content_preview") or "").strip()
        uri = f"s3://{s3_key_processed}" if s3_key_processed else ""

        fe = get_file_by_id_raw(db, file_id)
        file_name = fe.original_filename if fe else str(file_id)

        sources.append(ChatSource(
            file_id=file_id,
            file_name=file_name,
            page=None,
            score=float(score),
            fragment=fragment,
            uri=uri,
            s3_key_processed=s3_key_processed,
        ))

    # Direct call — no HTTP round-trip
    source_dicts: List[Dict[str, Any]] = [
        {"file_name": s.file_name, "score": s.score, "uri": s.uri,
         "fragment": s.fragment, "s3_key_processed": s.s3_key_processed}
        for s in sources
    ]
    answer = asyncio.get_event_loop().run_until_complete(generate_answer(user_message, source_dicts))

    if answer:
        return answer, sources

    # Fallback: structured list of sources
    lines = ["Found the most relevant fragments for your query:"]
    for i, s in enumerate(sources, 1):
        lines.append(
            f"\n{i}. **{s.file_name}**\n"
            f"   • Score: {s.score:.4f}\n"
            f"   • URI: {s.uri}\n"
            f"   • Fragment: {s.fragment[:300]}{'...' if len(s.fragment) > 300 else ''}"
        )
    return "\n".join(lines), sources
