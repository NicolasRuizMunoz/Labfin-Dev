from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .settings import settings
from .s3_client import download_keys_to_tmp
from .prompt import build_system_prompt, build_user_prompt
from .model_client import generate_text, ModelBackendError


app = FastAPI(title="Model Service (RAG Orchestrator)")


if settings.ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
    )


class SourceIn(BaseModel):
    file_name: str
    score: float
    uri: str
    fragment: str
    s3_key_processed: Optional[str] = None  # opcional si deseas que descargue algo


class RAGRequest(BaseModel):
    query: str
    top_sources: List[SourceIn]
    s3_keys: List[str] = Field(default_factory=list)  # opcional


class RAGResponse(BaseModel):
    answer: str
    used_sources: List[SourceIn]


@app.get("/health")
def health():
    return {
        "ok": True,
        "model": settings.OLLAMA_MODEL,
        "timeout": settings.REQUEST_TIMEOUT_SECONDS,
    }


@app.post("/rag/answer", response_model=RAGResponse)
async def rag_answer(payload: RAGRequest):
    sys_prompt = build_system_prompt()
    top = [s.model_dump() for s in payload.top_sources][: settings.MAX_SOURCES]

    user_prompt = build_user_prompt(
        query=payload.query,
        sources=top,
        max_chars_per_chunk=settings.MAX_CHARS_PER_CHUNK,
    )

    # DEBUG extra: tamaños combinados
    sys_len = len(sys_prompt)
    user_len = len(user_prompt)
    approx_tokens_total = len((sys_prompt + " " + user_prompt).split())
    print(
        f"[RAG_DEBUG] sys_len={sys_len} user_len={user_len} "
        f"total_chars={sys_len + user_len} total_tokens≈{approx_tokens_total} "
        f"raw_top_sources={len(payload.top_sources)}",
        flush=True,
    )

    try:
        answer = await generate_text(system_prompt=sys_prompt, user_prompt=user_prompt)
        return RAGResponse(
            answer=answer,
            used_sources=payload.top_sources[: settings.MAX_SOURCES],
        )
    except ModelBackendError as e:
        import traceback, sys as _sys
        traceback.print_exc(file=_sys.stderr)
        raise HTTPException(status_code=502, detail=str(e))
