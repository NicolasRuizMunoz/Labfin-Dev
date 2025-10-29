from enum import Enum

class FileStatusEnum(str, Enum):
    PENDING = "PENDING"             # Archivo subido al servidor, en cola.
    PROCESSING = "PROCESSING"         # Procesando: convirtiendo a TXT, normalizando.
    UPLOADING = "UPLOADING"         # Subiendo original y TXT a S3.
    VECTORIZING = "VECTORIZING"       # Creando embeddings y guardando en Vector DB.
    ACTIVE = "ACTIVE"               # Listo para ser consultado por el RAG.
    FAILED = "FAILED"               # Falló en alguna etapa.