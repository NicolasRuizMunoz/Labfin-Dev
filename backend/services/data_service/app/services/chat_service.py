import os
import httpx 
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from app.models.chat import ChatSession, ChatMessage
from app.routers.schemas.chat import ChatSource
from app.services.file_service import get_file_by_id_raw
from app.services.vector_store_faiss import FaissStore
from app.services.index_service import _EMBEDDER as EMBEDDER  # reutiliza el embedder cargado
from app.services import s3_service
from app.config import MODEL_SERVICE_URL, MODEL_SERVICE_TIMEOUT, MODEL_SERVICE_MAX_SOURCES

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
def _build_uri_from_key(s3_key_processed: str | None) -> str:
    if not s3_key_processed:
        return ""
    # Ajusta esto a tu formato real de URI pública / interna
    return f"s3://{s3_key_processed}"


def _dedupe_faiss_results(
    results: List[Tuple[float, dict]]
) -> List[Tuple[float, dict]]:
    """
    Deduplica resultados de FAISS para evitar múltiples fragmentos del MISMO texto.
    Criterio:
      - Si existe meta["s3_key_processed"], se usa como clave principal.
      - Si no, se usa meta["file_id"] como clave de fallback.
    De esta forma solo se mantiene el primer fragmento de cada texto origen.
    """
    seen = set()
    deduped: List[Tuple[float, dict]] = []

    for score, meta in results:
        s3_key = meta.get("s3_key_processed")
        file_id = meta.get("file_id")
        dedupe_key = s3_key or f"file:{file_id}"

        if dedupe_key in seen:
            continue

        seen.add(dedupe_key)
        deduped.append((score, meta))

    print(
        f"[CHAT_RAG_DEBUG] raw_results={len(results)} deduped_results={len(deduped)}",
        flush=True,
    )
    return deduped


def generate_assistant_reply(
    *,
    db: Session,
    user_message: str,
    organization_id: int,
    user_id: int,
    session_id: int,
) -> Tuple[str, List[ChatSource]]:
    """
    Recupera fragmentos similares desde FAISS y:
      - intenta llamar al model_service para generar 'answer' usando ese contexto,
      - si falla, hace fallback a una respuesta estructurada local con las fuentes.
    Deduplica resultados para que si varios hits provienen del mismo texto
    (mismo s3_key_processed o mismo file_id), solo se use un fragmento.
    """
    # 1) Embedding de la consulta
    qvec = EMBEDDER.embed_query(user_message)

    # 2) Buscar en el índice FAISS del org
    store = FaissStore(org_id=organization_id, dim=EMBEDDER.dim)
    results = store.search(qvec, top_k=5)

    if not results:
        return "No se encontraron fragmentos relevantes para tu consulta.", []

    # 2b) Deduplicar resultados por texto origen
    results = _dedupe_faiss_results(results)
    if not results:
        return "No se encontraron fragmentos relevantes únicos para tu consulta.", []

    # 3) Construir fuentes (para guardar y para enviar al orquestador)
    sources: List[ChatSource] = []
    for score, meta in results:
        file_id = int(meta.get("file_id"))
        s3_key_processed = meta.get("s3_key_processed")
        fragment = (meta.get("content_preview") or "").strip()
        uri = _build_uri_from_key(s3_key_processed)

        fe = get_file_by_id_raw(db, file_id)
        file_name = fe.original_filename if fe and getattr(fe, "original_filename", None) else str(file_id)

        sources.append(ChatSource(
            file_id=file_id,
            file_name=file_name,
            page=None,
            score=float(score),
            fragment=fragment,
            uri=uri,
            s3_key_processed=s3_key_processed,
        ))

    # 4) Orquestador (model_service): intentar generar respuesta del modelo
    answer = _call_model_service(user_message, sources)
    if answer:
        # Éxito → usamos la respuesta del modelo
        return answer, sources

    # 5) Fallback local: mensaje estructurado con las fuentes efectivamente usadas (deduplicadas)
    lines = ["He encontrado los fragmentos más relevantes para tu consulta:"]
    for i, s in enumerate(sources, start=1):
        lines.append(
            f"\n{i}. **{s.file_name}**\n"
            f"   • Relevancia: {s.score:.4f}\n"
            f"   • URI: {s.uri}\n"
            f"   • Fragmento: {s.fragment[:300]}{'...' if len(s.fragment) > 300 else ''}"
        )
    assistant_text = "\n".join(lines)
    return assistant_text, sources

def _to_top_source_dict(s: ChatSource) -> Dict[str, Any]:
    return {
        "file_name": s.file_name,
        "score": float(s.score),
        "uri": s.uri,
        "fragment": s.fragment,
        "s3_key_processed": s.s3_key_processed,  # ⬅️ nuevo
    }

def _call_model_service(query: str, sources: List[ChatSource]) -> Optional[str]:
    if not MODEL_SERVICE_URL:
        return None

    top = sources[:MODEL_SERVICE_MAX_SOURCES]
    payload = {
        "query": query,
        "top_sources": [_to_top_source_dict(s) for s in top],
        "s3_keys": []
    }

    try:
        with httpx.Client(timeout=MODEL_SERVICE_TIMEOUT) as client:
            r = client.post(MODEL_SERVICE_URL, json=payload)
            if r.status_code >= 400:
                # Logea cuerpo de error para diagnóstico
                print(f"[MODEL_SERVICE_ERROR] {r.status_code} -> {r.text[:500]}")
            r.raise_for_status()
            data = r.json()
            answer = (data or {}).get("answer")
            if isinstance(answer, str) and answer.strip():
                return answer.strip()
            return None
    except Exception as e:
        print(f"[MODEL_SERVICE_EXCEPTION] {e}")
        return None


