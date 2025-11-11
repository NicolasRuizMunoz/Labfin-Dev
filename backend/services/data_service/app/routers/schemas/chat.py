from pydantic import BaseModel, Field
from typing import Literal, List, Optional
from datetime import datetime

# --- Chat Session Schemas ---

class ChatSessionCreate(BaseModel):
    title: Optional[str] = "Nueva Conversación"

class ChatSessionResponse(BaseModel):
    id: int
    organization_id: int
    user_id: int
    title: str
    created_at: datetime

    model_config = { "from_attributes": True }

# --- Chat Message Schemas ---

class ChatMessageCreate(BaseModel):
    message: str

class ChatSource(BaseModel):
    """
    Fuente usada por la respuesta del agente (RAG).
    """
    file_id: int
    file_name: str
    page: Optional[int] = None
    score: float
    fragment: str
    uri: str

class ChatMessageResponse(BaseModel):
    id: int
    role: Literal["user", "assistant"]
    message: str
    sources: List[ChatSource] = Field(default_factory=list)
    created_at: datetime

    model_config = { "from_attributes": True }
