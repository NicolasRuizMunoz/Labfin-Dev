import os
import boto3
import fitz
import tempfile
from botocore.exceptions import BotoCoreError, ClientError
from app.config import (
    AWS_BUCKET_NAME,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION
)

# Cliente global reutilizable
s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

textract_client = boto3.client(
    "textract",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

def upload_file(local_path: str, s3_key: str) -> bool:
    if not os.path.exists(local_path):
        print(f"❌ Archivo local no encontrado: {local_path}")
        return False

    try:
        s3_client.upload_file(local_path, AWS_BUCKET_NAME, s3_key)
        print(f"✅ Subido: {s3_key}")
        return True
    except (BotoCoreError, ClientError) as e:
        print(f"❌ Error subiendo a S3: {e}")
        return False


def build_file_s3_key(
    company_id: int,
    local_filename: str,
    is_processed: bool,
    batch_id: int = None,
    category: str = "documentos"
) -> str | None:
    if category.lower() == "licitacion":
        if batch_id is None:
            return None
        carpeta = "procesados" if is_processed else "limpios"
        return f"{company_id}/documentos/licitaciones/{batch_id}/{carpeta}/{local_filename}"
    else:
        carpeta = "procesados" if is_processed else "limpios"
        return f"{company_id}/documentos/{carpeta}/{local_filename}"


def delete_file_from_s3(s3_key: str) -> bool:
    try:
        s3_client.delete_object(Bucket=AWS_BUCKET_NAME, Key=s3_key)
        print(f"✅ Archivo eliminado de S3: {s3_key}")
        return True
    except (BotoCoreError, ClientError) as e:
        print(f"❌ Error eliminando de S3: {e}")
        return False


def generate_presigned_download_url(s3_key: str, original_filename: str, expires_in: int = 3600) -> str | None:
    try:
        return s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': AWS_BUCKET_NAME,
                'Key': s3_key,
                'ResponseContentDisposition': f'attachment; filename="{original_filename}"'
            },
            ExpiresIn=expires_in
        )
    except (BotoCoreError, ClientError) as e:
        print(f"❌ Error generando presigned download URL: {e}")
        return None


def extract_text_with_textract(local_pdf_path: str) -> str:
    try:
        if not local_pdf_path.lower().endswith(".pdf"):
            raise ValueError("Archivo no es un PDF válido")

        if os.path.getsize(local_pdf_path) == 0:
            raise ValueError("Archivo PDF vacío")

        with open(local_pdf_path, "rb") as f:
            bytes_data = f.read()

        response = textract_client.detect_document_text(Document={"Bytes": bytes_data})
        lines = [block["Text"] for block in response["Blocks"] if block["BlockType"] == "LINE"]
        return "\n".join(lines)

    except Exception as e:
        print(f"❌ Error en Textract (PDF): {e}")
        return ""


def extract_text_from_pdf_images_via_textract(pdf_path: str) -> str:
    try:
        doc = fitz.open(pdf_path)
        text_result = []

        with tempfile.TemporaryDirectory() as tmpdir:
            for i, page in enumerate(doc):
                pix = page.get_pixmap(dpi=300)
                img_path = os.path.join(tmpdir, f"page_{i + 1}.jpg")
                pix.save(img_path)

                try:
                    with open(img_path, "rb") as f:
                        bytes_data = f.read()

                    response = textract_client.detect_document_text(Document={"Bytes": bytes_data})
                    lines = [block["Text"] for block in response["Blocks"] if block["BlockType"] == "LINE"]
                    page_text = "\n".join(lines)
                    text_result.append(page_text.strip())

                except Exception as e:
                    print(f"⚠️ Error OCR página {i+1}: {e}")

        doc.close()
        return "\n\n".join(text_result)

    except Exception as e:
        print(f"❌ Error general en OCR por imágenes: {e}")
        return ""
