from pydantic import BaseModel
from typing import Optional
from .file import FileEntryResponse

class UploadFileResponse(BaseModel):
    message: str
    file: FileEntryResponse