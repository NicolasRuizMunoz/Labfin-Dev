import os
from typing import List

def _split_csv(value: str) -> List[str]:
    return [v.strip() for v in (value or "").split(",") if v.strip()]

class Settings:
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
    REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "300"))

    MAX_SOURCES: int = int(os.getenv("MAX_SOURCES", "5"))
    MAX_CHARS_PER_CHUNK: int = int(os.getenv("MAX_CHARS_PER_CHUNK", "1200"))

    ALLOWED_ORIGINS: List[str] = _split_csv(os.getenv("ALLOWED_ORIGINS", ""))

    S3_BUCKET: str = os.getenv("S3_BUCKET", "")
    S3_REGION: str = os.getenv("S3_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")

settings = Settings()
