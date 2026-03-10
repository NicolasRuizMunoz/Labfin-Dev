from pydantic import BaseModel
from typing import List
from datetime import datetime
from app.schemas.file import FileEntryResponse


class FileBatchCreate(BaseModel):
    name: str


class FileBatchResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FileBatchWithFilesResponse(FileBatchResponse):
    files: List[FileEntryResponse] = []
