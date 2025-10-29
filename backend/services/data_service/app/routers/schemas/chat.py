from pydantic import BaseModel
from typing import Literal, List, Optional, Dict, Any
from datetime import datetime

# --- Chat Session Schemas ---

class ChatSessionCreate(BaseModel):
    title: Optional[str] = "Nueva Conversación"

class ChatSessionResponse(BaseModel):
    id: int
    organization_id: int
    user_id: int # Asumimos que el user_id viene del token
    title: str
    created_at: datetime

    model_config = { "from_attributes": True }

# --- Chat Message Schemas ---

class ChatMessageCreate(BaseModel):
    message: str

class ChatSource(BaseModel):
    """Información de la fuente (cita) usada en la respuesta."""
    file_id: int
    file_name: str
    page: Optional[int] = None
    score: float

class ChatMessageResponse(BaseModel):
    id: int
    role: Literal["user", "assistant"]
    message: str
    sources: List[ChatSource] = [] # Las fuentes que usó el RAG
    created_at: datetime

    model_config = { "from_attributes": True }