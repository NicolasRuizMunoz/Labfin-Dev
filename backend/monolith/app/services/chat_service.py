import asyncio
import logging
from typing import List, Optional, Tuple, Dict, Any

from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.models.chat import ChatSession, ChatMessage
from app.models.analisis_licitacion import AnalisisLicitacion
from app.schemas.chat import ChatSource
from app.services.file_service import get_file_by_id_raw
from app.services.vector_store_faiss import FaissStore
from app.services.embedding import get_embedder
from app.services.rag.rag_service import generate_answer

LOGGER = logging.getLogger(__name__)


# ------------ Sessions ------------

def create_session(
    db: Session, *, organization_id: int, user_id: int, title: Optional[str], licitacion_id: Optional[int] = None
) -> ChatSession:
    session = ChatSession(
        organization_id=organization_id,
        user_id=user_id,
        title=title or "Nueva Conversación",
        licitacion_id=licitacion_id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_or_create_licitacion_session(
    db: Session, *, organization_id: int, user_id: int, licitacion_id: int, title: Optional[str]
) -> ChatSession:
    """Returns the most recent chat session for this licitacion, or creates one."""
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.organization_id == organization_id,
            ChatSession.user_id == user_id,
            ChatSession.licitacion_id == licitacion_id,
        )
        .order_by(desc(ChatSession.created_at))
        .first()
    )
    if session:
        return session
    return create_session(
        db,
        organization_id=organization_id,
        user_id=user_id,
        title=title or "Consulta licitación",
        licitacion_id=licitacion_id,
    )


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


# ------------ Licitacion chat (OpenAI + historial) ------------

def _generate_licitacion_reply(
    db: Session, session: ChatSession, *, user_id: int
) -> Tuple[str, List[ChatSource]]:
    """
    Llama a OpenAI con:
    - System prompt con el análisis más reciente de la licitación
    - Historial completo de la sesión (ya incluye el mensaje del usuario recién guardado)
    """
    # 1. Obtener el análisis más reciente de la licitación
    analisis = (
        db.query(AnalisisLicitacion)
        .filter(
            AnalisisLicitacion.licitacion_id == session.licitacion_id,
            AnalisisLicitacion.organization_id == session.organization_id,
        )
        .order_by(desc(AnalisisLicitacion.created_at))
        .first()
    )

    # 2. System prompt
    system_content = (
        "Eres EVA, un asistente experto en análisis de licitaciones públicas y privadas. "
        "Ayudas al equipo de la empresa a entender, evaluar y responder preguntas sobre licitaciones. "
        "Responde siempre en español, de forma clara y concisa. "
        "Si no tienes información suficiente para responder, indícalo honestamente."
    )
    if analisis:
        system_content += (
            "\n\nCuentas con el siguiente análisis generado automáticamente para esta licitación:\n\n"
            f"{analisis.analisis}"
        )
    else:
        system_content += (
            "\n\nAún no hay un análisis EVA generado para esta licitación. "
            "Responde con la información que el usuario te proporcione en la conversación."
        )

    # 3. Historial completo de la sesión (ya contiene el mensaje del usuario actual al final)
    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(asc(ChatMessage.created_at))
        .all()
    )

    messages = [{"role": "system", "content": system_content}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.message})

    # 4. Llamar a OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=0.5,
    )
    answer = response.choices[0].message.content or "Sin respuesta."

    # Track token usage
    if response.usage:
        from app.services.token_usage_service import record_usage
        record_usage(
            db,
            organization_id=session.organization_id,
            user_id=user_id,
            usage_type="chat",
            model=OPENAI_MODEL,
            prompt_tokens=response.usage.prompt_tokens,
            completion_tokens=response.usage.completion_tokens,
            total_tokens=response.usage.total_tokens,
        )

    return answer, []


# ------------ RAG reply (chats generales sin licitacion) ------------

def _dedupe(results: List[Tuple[float, dict]]) -> List[Tuple[float, dict]]:
    seen, deduped = set(), []
    for score, meta in results:
        key = meta.get("s3_key_processed") or f"file:{meta.get('file_id')}"
        if key not in seen:
            seen.add(key)
            deduped.append((score, meta))
    return deduped


def _generate_rag_reply(
    db: Session, user_message: str, organization_id: int
) -> Tuple[str, List[ChatSource]]:
    embedder = get_embedder()
    qvec = embedder.embed_query(user_message)

    store = FaissStore(org_id=organization_id, dim=embedder.dim)
    results = store.search(qvec, top_k=5)
    if not results:
        return "No encontré fragmentos relevantes para tu consulta.", []

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
            file_id=file_id, file_name=file_name, page=None,
            score=float(score), fragment=fragment, uri=uri, s3_key_processed=s3_key_processed,
        ))

    source_dicts: List[Dict[str, Any]] = [
        {"file_name": s.file_name, "score": s.score, "uri": s.uri,
         "fragment": s.fragment, "s3_key_processed": s.s3_key_processed}
        for s in sources
    ]
    answer = asyncio.run(generate_answer(user_message, source_dicts))

    if answer:
        return answer, sources

    lines = ["Fragmentos más relevantes encontrados:"]
    for i, s in enumerate(sources, 1):
        lines.append(
            f"\n{i}. **{s.file_name}**\n"
            f"   • Score: {s.score:.4f}\n"
            f"   • Fragmento: {s.fragment[:300]}{'...' if len(s.fragment) > 300 else ''}"
        )
    return "\n".join(lines), sources


# ------------ Entry point para el router ------------

def generate_assistant_reply(
    *,
    db: Session,
    user_message: str,
    organization_id: int,
    user_id: int,
    session_id: int,
) -> Tuple[str, List[ChatSource]]:
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()

    if session and session.licitacion_id:
        return _generate_licitacion_reply(db, session, user_id=user_id)

    return _generate_rag_reply(db, user_message, organization_id)
