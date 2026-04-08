"""
Configuration — dual-mode: local (.env) or production (ECS + Secrets Manager).

How it works:
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  LOCAL DEV                                                                  │
  │  .env file present → python-dotenv loads it → DEV_MODE=true                │
  │  Backend: http://localhost:8000                                             │
  │  Frontend: http://localhost:5173  (Vite proxy handles /api)                │
  │  Cookies: SameSite=Lax, Secure=False                                       │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │  PRODUCTION (ECS Fargate)                                                  │
  │  No .env → USE_DOTENV=false in Dockerfile → env vars from Secrets Manager  │
  │  ECS Task Definition references Secrets Manager ARNs directly              │
  │  → they appear as normal env vars to the app. No boto3 needed.             │
  │  Cookies: SameSite=None, Secure=True (HTTPS required)                      │
  └─────────────────────────────────────────────────────────────────────────────┘

To switch: the ONLY difference is whether .env exists.
  - With .env    → local dev mode, all defaults point to localhost
  - Without .env → production mode, env vars MUST be set externally (ECS/Secrets)
"""
import os
import logging
from pathlib import Path
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)

# Auto-detect: if .env exists we're in dev, otherwise production.
_env_file = Path(__file__).resolve().parent.parent / ".env"
_use_dotenv = os.getenv("USE_DOTENV", "true" if _env_file.exists() else "false").lower() == "true"

if _use_dotenv:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=str(_env_file))
    logger.info("Loaded .env file — running in LOCAL DEV mode")
else:
    logger.info("No .env file — running in PRODUCTION mode (env vars from ECS/Secrets Manager)")

# ── Runtime mode ──────────────────────────────────────────────────────────────
DEV_MODE = os.getenv("DEV_MODE", "true" if _use_dotenv else "false").lower() == "true"

# ── Database ──────────────────────────────────────────────────────────────────
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "labfin")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

# ── JWT / Security ────────────────────────────────────────────────────────────
_secret = os.getenv("SECRET_KEY", "")
if not _secret:
    if DEV_MODE:
        _secret = "dev-secret-NOT-FOR-PRODUCTION"
        logger.warning("SECRET_KEY not set — using insecure dev default. Set SECRET_KEY in .env for production.")
    else:
        raise RuntimeError("SECRET_KEY environment variable is required in production. Set DEV_MODE=true to use a dev default.")
SECRET_KEY: str = _secret
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
# Must be True in production (required for SameSite=None cookies over HTTPS)
SECURE_COOKIES = os.getenv("SECURE_COOKIES", "false" if DEV_MODE else "true").lower() == "true"

# ── SMTP (password reset emails) ─────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "") or SMTP_USER
RESET_CODE_EXPIRE_MINUTES = int(os.getenv("RESET_CODE_EXPIRE_MINUTES", "15"))

# ── Google OAuth (optional) ───────────────────────────────────────────────────
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGINS: list[str] = [
    o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()
]

# ── Files ─────────────────────────────────────────────────────────────────────
ALLOWED_EXTENSIONS: list[str] = [
    e.strip().lower() for e in os.getenv(
        "ALLOWED_EXTENSIONS", "pdf,txt,csv,docx,xlsx,xls,pptx"
    ).split(",") if e.strip()
]
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploaded_files")
PROCESSED_DIR = os.getenv("PROCESSED_DIR", "processed_files")

# ── AWS S3 ────────────────────────────────────────────────────────────────────
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME", "evalitics-bucket")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# ── FAISS ─────────────────────────────────────────────────────────────────────
FAISS_DIR = os.getenv("FAISS_DIR", "data/faiss")

# ── Embedding ─────────────────────────────────────────────────────────────────
# EMBED_BACKEND: "sentence_transformer" (default, model runs in-process)
EMBED_BACKEND = os.getenv("EMBED_BACKEND", "sentence_transformer")
EMBED_MODEL = os.getenv("EMBED_MODEL", "intfloat/multilingual-e5-small")

# ── RAG ───────────────────────────────────────────────────────────────────────
MAX_SOURCES = int(os.getenv("MAX_SOURCES", "5"))
MAX_CHARS_PER_CHUNK = int(os.getenv("MAX_CHARS_PER_CHUNK", "1200"))

# ── OpenAI ────────────────────────────────────────────────────────────────────
# Used for: tender analysis, simulation analysis, and RAG chat.
# Recommended models by cost/context window:
#   gpt-4o-mini  → 128k tokens, cheapest, good quality (default)
#   gpt-4o       → 128k tokens, best quality
#   gpt-4.1-mini → 1M tokens, ideal for very long documents
#   gpt-4.1      → 1M tokens, best quality + huge context
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
# Character limits sent to the LLM (current values use ~35% of gpt-4o-mini window).
ANALYSIS_MAX_LIC_CHARS = int(os.getenv("ANALYSIS_MAX_LIC_CHARS", "180000"))
ANALYSIS_MAX_COMPANY_CHARS = int(os.getenv("ANALYSIS_MAX_COMPANY_CHARS", "80000"))
