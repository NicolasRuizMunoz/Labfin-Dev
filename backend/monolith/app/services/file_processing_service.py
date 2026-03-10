import os
import re

import fitz  # PyMuPDF

from app.config import PROCESSED_DIR

os.makedirs(PROCESSED_DIR, exist_ok=True)


def _clean_and_normalize_text(raw_text: str) -> str:
    text = raw_text.lower()
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def process_file_to_text(local_pdf_path: str) -> str:
    """Convert PDF to a normalised .txt file, with Textract OCR fallback."""
    try:
        doc = fitz.open(local_pdf_path)
        full_text = "".join(page.get_text() for page in doc)
        doc.close()
    except Exception as e:
        raise ValueError(f"PyMuPDF could not process file: {e}")

    if len(full_text.strip()) < 50:
        try:
            from app.services import s3_service
            full_text = s3_service.extract_text_from_pdf_images_via_textract(local_pdf_path)
        except Exception:
            pass

    cleaned = _clean_and_normalize_text(full_text)
    base = os.path.basename(local_pdf_path)
    out = os.path.join(PROCESSED_DIR, os.path.splitext(base)[0] + ".txt")
    with open(out, "w", encoding="utf-8") as f:
        f.write(cleaned)
    return out
