"""
Análisis de licitaciones con OpenAI.

Flujo:
  1. Obtener chunks indexados de los documentos de la licitación.
  2. Obtener chunks de documentos activos de la empresa (sin licitacion_id).
  3. Construir un prompt de análisis y llamar a GPT-4o.
  4. Retornar el análisis como texto.
"""
import logging
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session
from openai import OpenAI, OpenAIError

from app.config import OPENAI_API_KEY, OPENAI_MODEL, ANALYSIS_MAX_LIC_CHARS, ANALYSIS_MAX_COMPANY_CHARS
from app.models.document_chunk import DocumentChunk
from app.models.file import FileEntry

LOGGER = logging.getLogger(__name__)

_SYSTEM_PROMPT = """Eres un analista financiero y de negocios experto en licitaciones públicas y privadas de Chile y Latinoamérica.
Tu tarea es analizar los documentos de una licitación y cruzarlos con la información de la empresa para emitir un análisis ejecutivo.

El análisis debe incluir obligatoriamente:
1. **Resumen de la licitación**: qué se solicita, plazos clave, requisitos principales.
2. **Fit con la empresa**: qué tan bien calza la licitación con la capacidad, rubro y experiencia de la empresa.
3. **Análisis financiero**:
   - Estimación de costos directos e indirectos.
   - Margen estimado.
   - Tiempo estimado para alcanzar el punto de equilibrio (escenario optimista, base y pesimista).
4. **Riesgos principales**: técnicos, financieros, legales, operativos.
5. **Oportunidades y ventajas competitivas**.
6. **Recomendación final**: postular / no postular, con justificación.

Sé directo, usa cifras cuando puedas inferirlas, y estructura la respuesta con headers claros en markdown."""


def _build_user_prompt(
    licitacion_nombre: str,
    fecha_vencimiento: Optional[str],
    lic_text: str,
    company_text: str,
) -> str:
    venc = f"Fecha de vencimiento: {fecha_vencimiento}" if fecha_vencimiento else "Sin fecha de vencimiento especificada."
    return f"""# Licitación: {licitacion_nombre}
{venc}

---

## DOCUMENTOS DE LA LICITACIÓN

{lic_text or "(Sin documentos indexados para esta licitación. Confirma los archivos primero.)"}

---

## INFORMACIÓN DE LA EMPRESA

{company_text or "(Sin documentos de empresa disponibles. Sube y confirma documentos corporativos en el gestor de archivos.)"}

---

Genera el análisis completo según las instrucciones del sistema."""


def _get_chunks_text(db: Session, file_ids: list[int], org_id: int, max_chars: int) -> str:
    if not file_ids:
        return ""
    chunks = (
        db.query(DocumentChunk)
        .filter(
            DocumentChunk.file_entry_id.in_(file_ids),
            DocumentChunk.organization_id == org_id,
        )
        .order_by(DocumentChunk.file_entry_id, DocumentChunk.id)
        .all()
    )
    parts = []
    total = 0
    for chunk in chunks:
        text = (chunk.content_text or "").strip()
        if not text:
            continue
        if total + len(text) > max_chars:
            remaining = max_chars - total
            if remaining > 100:
                parts.append(text[:remaining])
            break
        parts.append(text)
        total += len(text)
    return "\n\n".join(parts)


def analyze_licitacion(db: Session, org_id: int, licitacion_id: int) -> dict:
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY no configurada. Agrega la clave al archivo .env del backend.",
        )

    # Archivos de la licitación
    lic_file_ids = [
        row[0]
        for row in db.query(FileEntry.id).filter(
            FileEntry.organization_id == org_id,
            FileEntry.licitacion_id == licitacion_id,
        ).all()
    ]

    # Archivos activos de la empresa (sin licitacion_id)
    company_file_ids = [
        row[0]
        for row in db.query(FileEntry.id).filter(
            FileEntry.organization_id == org_id,
            FileEntry.licitacion_id.is_(None),
            FileEntry.is_active.is_(True),
        ).all()
    ]

    lic_text = _get_chunks_text(db, lic_file_ids, org_id, ANALYSIS_MAX_LIC_CHARS)
    company_text = _get_chunks_text(db, company_file_ids, org_id, ANALYSIS_MAX_COMPANY_CHARS)

    if not lic_text and not company_text:
        raise HTTPException(
            status_code=422,
            detail="No hay contenido indexado. Confirma los archivos de la licitación y/o documentos de empresa primero.",
        )

    # Obtener metadatos de la licitación para el prompt
    from app.models.licitacion import Licitacion
    lic = db.query(Licitacion).filter(
        Licitacion.id == licitacion_id,
        Licitacion.organization_id == org_id,
    ).first()
    if not lic:
        raise HTTPException(status_code=404, detail="Licitación no encontrada")

    fecha_str = lic.fecha_vencimiento.isoformat() if lic.fecha_vencimiento else None
    user_prompt = _build_user_prompt(lic.nombre, fecha_str, lic_text, company_text)

    LOGGER.info(
        f"[ANALYSIS] licitacion_id={licitacion_id} | lic_chunks_chars={len(lic_text)} | "
        f"company_chunks_chars={len(company_text)} | model={OPENAI_MODEL}"
    )

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
        )
        answer = response.choices[0].message.content or ""
        tokens_used = response.usage.total_tokens if response.usage else None
    except OpenAIError as e:
        LOGGER.error(f"[ANALYSIS] OpenAI error: {e}")
        raise HTTPException(status_code=502, detail=f"Error al llamar a OpenAI: {e}")

    return {
        "analisis": answer,
        "model": OPENAI_MODEL,
        "tokens_usados": tokens_used,
        "chunks_licitacion": len(lic_file_ids),
        "chunks_empresa": len(company_file_ids),
    }
