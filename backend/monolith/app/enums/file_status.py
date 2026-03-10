from enum import Enum


class FileStatusEnum(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    UPLOADING = "UPLOADING"
    VECTORIZING = "VECTORIZING"
    ACTIVE = "ACTIVE"
    FAILED = "FAILED"
