from pydantic import BaseModel
from app.schemas.file import FileEntryResponse


class UploadFileResponse(BaseModel):
    message: str
    file: FileEntryResponse
