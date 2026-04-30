import logging
from typing import List, Optional, Tuple

from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.models.chat import ChatSession, ChatMessage
from app.models.analisis_licitacion import AnalisisLicitacion
from app.models.document_chunk import DocumentChunk
from app.models.file import FileEntry
from app.schemas.chat import ChatSource

LOGGER = logging.getLogger(__name__)

# Tope de caracteres del contexto de chunks que se inyecta al chat genérico
_CHAT_MAX_CONTEXT_CHARS = 12000


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


# ------------ Reply para chats sin licitacion (context-stuffing de chunks) ------------

def _generate_generic_reply(
    db: Session, session: ChatSession, *, user_id: int
) -> Tuple[str, List[ChatSource]]:
    """
    Chat sin licitacion_id. Sin embeddings ni búsqueda vectorial: se inyecta
    como contexto el contenido de los chunks activos de la organización
    (truncado a _CHAT_MAX_CONTEXT_CHARS) y se delega a OpenAI.
    """
    chunks = (
        db.query(DocumentChunk, FileEntry)
        .join(FileEntry, FileEntry.id == DocumentChunk.file_entry_id)
        .filter(
            DocumentChunk.organization_id == session.organization_id,
            FileEntry.is_active.is_(True),
        )
        .order_by(DocumentChunk.file_entry_id, DocumentChunk.id)
        .all()
    )

    context_parts: List[str] = []
    sources_seen: dict = {}
    total_chars = 0
    for chunk, fe in chunks:
        text = (chunk.content_text or "").strip()
        if not text:
            continue
        block = f"[{fe.original_filename}]\n{text}"
        if total_chars + len(block) > _CHAT_MAX_CONTEXT_CHARS:
            remaining = _CHAT_MAX_CONTEXT_CHARS - total_chars
            if remaining > 200:
                context_parts.append(block[:remaining])
            break
        context_parts.append(block)
        total_chars += len(block)
        if fe.id not in sources_seen:
            sources_seen[fe.id] = ChatSource(
                file_id=fe.id,
                file_name=fe.original_filename,
                page=None,
                score=1.0,
                fragment=text[:300],
                uri="",
                s3_key_processed=fe.s3_key_processed,
            )

    system_content = (
        "Eres EVA, un asistente experto en análisis de licitaciones públicas y privadas. "
        "Responde siempre en español, de forma clara y concisa. "
        "Si la información en el contexto no alcanza para responder, indícalo honestamente."
    )
    if context_parts:
        system_content += (
            "\n\nContexto de los documentos de la organización:\n\n"
            + "\n\n---\n\n".join(context_parts)
        )
    else:
        system_content += (
            "\n\nNo hay documentos indexados para esta organización. "
            "Responde con la información que el usuario te proporcione en la conversación."
        )

    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(asc(ChatMessage.created_at))
        .all()
    )
    messages = [{"role": "system", "content": system_content}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.message})

    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=0.5,
    )
    answer = response.choices[0].message.content or "Sin respuesta."

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

    return answer, list(sources_seen.values())


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

    return _generate_generic_reply(db, session, user_id=user_id)
