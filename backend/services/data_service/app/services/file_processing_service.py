import os
import fitz  # PyMuPDF
import re
from app.config import PROCESSED_DIR
from app.services import s3_service # Solo para llamar a Textract

os.makedirs(PROCESSED_DIR, exist_ok=True)

def _clean_and_normalize_text(raw_text: str) -> str:
    """
    Toma texto crudo y aplica la normalización básica.
    (Basado en tu código de PoC y tu solicitud).
    """
    # 1. Pasar a minúsculas
    text = raw_text.lower()
    
    # 2. Eliminar saltos de línea y reemplazarlos por un espacio
    text = text.replace("\n", " ")
    
    # 3. Eliminar espacios múltiples
    text = re.sub(r"\s+", " ", text).strip()
    
    # (Puedes agregar más reglas de normalización aquí si es necesario)
    
    return text

def process_file_to_text(local_pdf_path: str) -> str:
    """
    Convierte un archivo local (ej. PDF) a un archivo .txt normalizado.
    Retorna el path al archivo .txt procesado.
    """
    try:
        doc = fitz.open(local_pdf_path)
        full_text = ""
        for page in doc:
            full_text += page.get_text()
        doc.close()
    except Exception as e:
        print(f"❌ Error al abrir PDF con PyMuPDF: {e}")
        raise ValueError(f"No se pudo procesar el archivo: {e}")

    # Si PyMuPDF no extrae texto (ej. imagen escaneada), usa Textract
    if len(full_text.strip()) < 50:
        print("📄 Texto vacío o escaneado, usando Textract...")
        try:
            # Reutilizamos la función de s3_service que ya tenías
            full_text = s3_service.extract_text_from_pdf_images_via_textract(local_pdf_path)
        except Exception as e:
            print(f"❌ Error durante OCR con Textract: {e}")
            # Continuar con el texto (casi) vacío si Textract falla
            pass

    # Aplicar la normalización
    cleaned_text = _clean_and_normalize_text(full_text)

    # Guardar el archivo .txt procesado
    base_filename = os.path.basename(local_pdf_path)
    # Asegura que la extensión se cambie a .txt
    txt_filename = os.path.splitext(base_filename)[0] + ".txt"
    processed_path = os.path.join(PROCESSED_DIR, txt_filename)

    try:
        with open(processed_path, "w", encoding="utf-8") as f:
            f.write(cleaned_text)
    except Exception as e:
        print(f"❌ Error al guardar archivo .txt procesado: {e}")
        raise ValueError(f"No se pudo guardar el .txt: {e}")

    print(f"✅ Texto procesado y normalizado guardado en: {processed_path}")
    return processed_path