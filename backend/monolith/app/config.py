import os
from urllib.parse import quote_plus

if os.getenv("USE_DOTENV", "true").lower() == "true":
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=".env")

# Database
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "labfin")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

# JWT / Security
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "180"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Google OAuth (optional)
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# CORS
CORS_ORIGINS: list[str] = [
    o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()
]

# Files
ALLOWED_EXTENSIONS: list[str] = [
    e.strip().lower() for e in os.getenv(
        "ALLOWED_EXTENSIONS", "pdf,txt,csv,docx,xlsx,xls,pptx"
    ).split(",") if e.strip()
]
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploaded_files")
PROCESSED_DIR = os.getenv("PROCESSED_DIR", "processed_files")

# AWS S3
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME", "evalitics-bucket")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# FAISS
FAISS_DIR = os.getenv("FAISS_DIR", "data/faiss")

# Embedding backend — set EMBED_BACKEND to switch transformer:
#   "sentence_transformer"  → intfloat/multilingual-e5-small (default)
#   Future: "openai", "ollama", etc.
EMBED_BACKEND = os.getenv("EMBED_BACKEND", "sentence_transformer")
EMBED_MODEL = os.getenv("EMBED_MODEL", "intfloat/multilingual-e5-small")

# Ollama / LLM
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "300"))
MAX_SOURCES = int(os.getenv("MAX_SOURCES", "5"))
MAX_CHARS_PER_CHUNK = int(os.getenv("MAX_CHARS_PER_CHUNK", "1200"))

# OpenAI (para análisis de licitaciones)
# Modelos recomendados por costo/ventana:
#   gpt-4o-mini  → 128k tokens, ~17x más barato que gpt-4o, buena calidad (recomendado)
#   gpt-4o       → 128k tokens, máxima calidad
#   gpt-4.1-mini → 1M tokens, ideal si los documentos son muy extensos
#   gpt-4.1      → 1M tokens, máxima calidad + contexto enorme
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
# Límites de caracteres enviados al LLM.
# gpt-4o / gpt-4o-mini tienen ventana de ~500k chars; gpt-4.1* hasta ~4M chars.
# Valores actuales usan ~35% de la ventana disponible — aumentar si los docs son muy largos.
ANALYSIS_MAX_LIC_CHARS = int(os.getenv("ANALYSIS_MAX_LIC_CHARS", "180000"))
ANALYSIS_MAX_COMPANY_CHARS = int(os.getenv("ANALYSIS_MAX_COMPANY_CHARS", "80000"))
