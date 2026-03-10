from pydantic import BaseModel, Field
from typing import Literal, List, Optional
from datetime import datetime


class ChatSessionCreate(BaseModel):
    title: Optional[str] = "Nueva Conversación"


class ChatSessionResponse(BaseModel):
    id: int
    organization_id: int
    user_id: int
    title: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageCreate(BaseModel):
    message: str


class ChatSource(BaseModel):
    file_id: int
    file_name: str
    page: Optional[int] = None
    score: float
    fragment: str
    uri: str
    s3_key_processed: Optional[str] = None


class ChatMessageResponse(BaseModel):
    id: int
    role: Literal["user", "assistant"]
    message: str
    sources: List[ChatSource] = Field(default_factory=list)
    created_at: datetime

    model_config = {"from_attributes": True}
