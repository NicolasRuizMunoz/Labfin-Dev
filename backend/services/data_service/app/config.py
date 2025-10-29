import os

# Cargar .env solo si USE_DOTENV es true o no está seteado
if os.getenv("USE_DOTENV", "true").lower() == "true":
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=".env")

# Base de datos
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Archivos
ALLOWED_EXTENSIONS = os.getenv("ALLOWED_EXTENSIONS", "pdf").split(",")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploaded_files")
PROCESSED_DIR = os.getenv("PROCESSED_DIR", "/app/processed_files")

# AWS S3
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME", "evalitics-bucket")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# N8N
N8N_WEBHOOK_URL_1 = os.getenv("N8N_WEBHOOK_URL_1")
N8N_WEBHOOK_URL_2 = os.getenv("N8N_WEBHOOK_URL_2")
N8N_SECRET_KEY = os.getenv("N8N_SECRET_KEY") 
N8N_BASIC_AUTH_USER = os.getenv("N8N_BASIC_AUTH_USER")
N8N_BASIC_AUTH_PASSWORD = os.getenv("N8N_BASIC_AUTH_PASSWORD")