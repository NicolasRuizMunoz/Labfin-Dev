import os
import tempfile
from typing import Optional

import boto3
import fitz
from botocore.exceptions import BotoCoreError, ClientError

from app.config import AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION

s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)
textract_client = boto3.client(
    "textract",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)


def upload_file(local_path: str, s3_key: str) -> bool:
    if not os.path.exists(local_path):
        print(f"Local file not found: {local_path}")
        return False
    try:
        s3_client.upload_file(local_path, AWS_BUCKET_NAME, s3_key)
        return True
    except (BotoCoreError, ClientError) as e:
        print(f"S3 upload error: {e}")
        return False


def download_file(s3_key: str, local_path: str) -> bool:
    try:
        s3_client.download_file(AWS_BUCKET_NAME, s3_key, local_path)
        return True
    except (BotoCoreError, ClientError) as e:
        print(f"S3 download error: {e}")
        return False


def build_file_s3_key(
    organization_id: int,
    local_filename: str,
    is_processed: bool,
    batch_id: Optional[int] = None,
) -> str:
    folder = "processed" if is_processed else "originals"
    if batch_id:
        return f"{organization_id}/batches/{batch_id}/{folder}/{local_filename}"
    return f"{organization_id}/files/{folder}/{local_filename}"


def delete_file_from_s3(s3_key: str) -> bool:
    try:
        s3_client.delete_object(Bucket=AWS_BUCKET_NAME, Key=s3_key)
        return True
    except (BotoCoreError, ClientError) as e:
        print(f"S3 delete error: {e}")
        return False


def generate_presigned_download_url(s3_key: str, original_filename: str, expires_in: int = 3600) -> Optional[str]:
    try:
        return s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": AWS_BUCKET_NAME,
                "Key": s3_key,
                "ResponseContentDisposition": f'attachment; filename="{original_filename}"',
            },
            ExpiresIn=expires_in,
        )
    except (BotoCoreError, ClientError) as e:
        print(f"Presigned URL error: {e}")
        return None


def extract_text_from_pdf_images_via_textract(pdf_path: str) -> str:
    try:
        doc = fitz.open(pdf_path)
        pieces = []
        with tempfile.TemporaryDirectory() as tmpdir:
            for i, page in enumerate(doc):
                pix = page.get_pixmap(dpi=300)
                img_path = os.path.join(tmpdir, f"page_{i+1}.jpg")
                pix.save(img_path)
                with open(img_path, "rb") as f:
                    bytes_data = f.read()
                try:
                    response = textract_client.detect_document_text(Document={"Bytes": bytes_data})
                    lines = [b["Text"] for b in response["Blocks"] if b["BlockType"] == "LINE"]
                    pieces.append("\n".join(lines).strip())
                except Exception as e:
                    print(f"Textract page {i+1}: {e}")
        doc.close()
        return "\n\n".join(pieces)
    except Exception as e:
        print(f"OCR error: {e}")
        return ""
