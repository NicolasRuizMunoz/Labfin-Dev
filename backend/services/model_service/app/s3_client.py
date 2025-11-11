from typing import List, Tuple
import os
import tempfile
import boto3
from .settings import settings

def download_keys_to_tmp(keys: List[str]) -> List[Tuple[str, str]]:
    """
    Descarga keys S3 en /tmp. Devuelve [(key, local_path), ...].
    Si no hay credenciales/bucket configurados, levanta excepción.
    """
    if not settings.S3_BUCKET:
        raise RuntimeError("S3_BUCKET no configurado")
    session = boto3.session.Session(
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        region_name=settings.S3_REGION or None,
    )
    s3 = session.client("s3")
    result: List[Tuple[str, str]] = []
    for key in keys:
        fd, tmp_path = tempfile.mkstemp(prefix="rag_", suffix="_" + key.split("/")[-1])
        os.close(fd)
        s3.download_file(settings.S3_BUCKET, key, tmp_path)
        result.append((key, tmp_path))
    return result
