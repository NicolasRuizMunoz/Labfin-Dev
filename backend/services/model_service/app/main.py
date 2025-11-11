from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .settings import settings
from .s3_client import download_keys_to_tmp
from .prompt import build_system_prompt, build_user_prompt
from .model_client import generate_text

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
    return {"ok": True, "model": settings.OLLAMA_MODEL}
from .model_client import generate_text, ModelBackendError

@app.post("/rag/answer", response_model=RAGResponse)
async def rag_answer(payload: RAGRequest):
    # (si usas S3, deja tu bloque de descarga tal cual)
    sys_prompt = build_system_prompt()
    top = [s.model_dump() for s in payload.top_sources][: settings.MAX_SOURCES]
    user_prompt = build_user_prompt(
        query=payload.query,
        sources=top,
        max_chars_per_chunk=settings.MAX_CHARS_PER_CHUNK,
    )
    try:
        answer = await generate_text(system_prompt=sys_prompt, user_prompt=user_prompt)
        return RAGResponse(answer=answer, used_sources=payload.top_sources[: settings.MAX_SOURCES])
    except ModelBackendError as e:
        # Log y detalle claro en la respuesta
        import traceback, sys
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=502, detail=str(e))
