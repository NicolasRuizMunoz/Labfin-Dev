import os
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from app.models.chat import ChatSession, ChatMessage
from app.routers.schemas.chat import ChatSource
from app.services.file_service import get_file_by_id_raw
from app.services.vector_store_faiss import FaissStore
from app.services.index_service import _EMBEDDER as EMBEDDER  # reutiliza el embedder cargado
from app.services import s3_service

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

# ------------ Utilidades internas ------------

def _build_uri_from_key(key: Optional[str]) -> str:
    """
    Intenta construir una URL/URI útil para el front.
    Prioriza un método explícito del s3_service si existe; fallback a s3://bucket/key o base pública.
    """
    if not key:
        return ""

    # Si tu s3_service expone build_public_url / generate_presigned_url, úsalos:
    if hasattr(s3_service, "build_public_url"):
        try:
            return s3_service.build_public_url(key)  # típico: https://<bucket-public>/<key>
        except Exception:
            pass
    if hasattr(s3_service, "generate_presigned_url"):
        try:
            return s3_service.generate_presigned_url(key, expires_in=3600)
        except Exception:
            pass

    # Fallback simple:
    bucket = os.environ.get("S3_BUCKET", "").strip()
    public_base = os.environ.get("S3_PUBLIC_BASE_URL", "").rstrip("/")
    if public_base:
        return f"{public_base}/{key}"
    if bucket:
        return f"s3://{bucket}/{key}"
    return key  # como último recurso

# ------------ Integración "agente" basada en RAG ------------

def generate_assistant_reply(
    *,
    db: Session,
    user_message: str,
    organization_id: int,
    user_id: int,
    session_id: int,
) -> Tuple[str, List[ChatSource]]:
    """
    Recupera los top-5 fragmentos más similares desde FAISS y arma la respuesta estructurada.
    """
    # 1) Generar embedding de la consulta
    qvec = EMBEDDER.embed_query(user_message)

    # 2) Buscar en el índice FAISS
    store = FaissStore(org_id=organization_id, dim=EMBEDDER.dim)
    results = store.search(qvec, top_k=5)

    if not results:
        return "No se encontraron fragmentos relevantes para tu consulta.", []

    sources: List[ChatSource] = []

    for score, meta in results:
        file_id = int(meta.get("file_id"))
        s3_key_processed = meta.get("s3_key_processed")
        fragment = meta.get("content_preview", "").strip()
        uri = _build_uri_from_key(s3_key_processed)

        # Obtener el nombre del archivo
        fe = get_file_by_id_raw(db, file_id)
        file_name = fe.original_filename if fe and getattr(fe, "original_filename", None) else str(file_id)

        sources.append(ChatSource(
            file_id=file_id,
            file_name=file_name,
            page=None,
            score=float(score),
            fragment=fragment,
            uri=uri,
        ))

    # 3) Armar mensaje estructurado para el agente / frontend
    lines = ["He encontrado los 5 fragmentos más relevantes para tu consulta:"]
    for i, s in enumerate(sources, start=1):
        lines.append(
            f"\n{i}. **{s.file_name}**\n"
            f"   • Relevancia: {s.score:.4f}\n"
            f"   • URI: {s.uri}\n"
            f"   • Fragmento: {s.fragment[:300]}{'...' if len(s.fragment) > 300 else ''}"
        )

    assistant_text = "\n".join(lines)
    return assistant_text, sources
