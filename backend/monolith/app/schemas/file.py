from pydantic import BaseModel, Field
from typing import Optional, List
from app.enums.file_status import FileStatusEnum
from datetime import datetime


class FileEntryResponse(BaseModel):
    id: int = Field(..., alias="id")
    batch_id: Optional[int]
    organization_id: int
    original_filename: str
    status: FileStatusEnum
    is_active: bool
    s3_key_original: Optional[str]
    s3_key_processed: Optional[str]
    uploaded_at: datetime
    processed_at: Optional[datetime]

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }


class FileIdsRequest(BaseModel):
    file_ids: List[int]


class FileActiveStatusUpdate(BaseModel):
    is_active: bool
