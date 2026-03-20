"""
Análisis de licitaciones con OpenAI.

Flujo:
  1. Obtener chunks indexados de los documentos de la licitación.
  2. Obtener chunks de documentos activos de la empresa (sin licitacion_id).
  3. Construir un prompt de análisis y llamar al modelo configurado.
  4. Parsear el bloque JSON con datos de breakeven y curvas por escenario.
  5. Guardar el análisis en la tabla analisis_licitaciones.
  6. Retornar el análisis completo.
"""
import json
import logging
import re
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session
from openai import OpenAI, OpenAIError

from app.config import OPENAI_API_KEY, OPENAI_MODEL, ANALYSIS_MAX_LIC_CHARS, ANALYSIS_MAX_COMPANY_CHARS
from app.models.analisis_licitacion import AnalisisLicitacion
from app.models.document_chunk import DocumentChunk
from app.models.file import FileEntry

LOGGER = logging.getLogger(__name__)

_SYSTEM_PROMPT = """Eres un analista financiero experto en licitaciones públicas y privadas de Chile y Latinoamérica.

Escribe en texto plano, sin markdown. Usa títulos en mayúsculas seguidos de dos puntos para separar secciones (ejemplo: "RESUMEN:"). No uses asteriscos, almohadillas, guiones de lista ni ningún símbolo de formato. Escribe en párrafos cortos y directos. El análisis completo no debe superar 900 palabras.

Incluye estas secciones en orden:

RESUMEN: Qué se solicita, las fechas clave indicadas en las bases (cierre de oferta, adjudicación, inicio de contrato) y requisitos principales (2-3 oraciones).

FIT CON LA EMPRESA: Qué tan bien calza con la capacidad y experiencia de la empresa (2-3 oraciones).

LOGÍSTICA Y ABASTECIMIENTO: Indica si el producto o servicio requiere stock inmediato o debe importarse/exportarse. Si implica importación o despacho externo, estima el plazo de entrega probable y el impacto en los plazos exigidos. Si el documento no tiene información suficiente, señálalo explícitamente.

ANÁLISIS FINANCIERO: Estimación del costo del producto o servicio (unitario o mensual). Margen estimado sobre el precio de la licitación. Costos fijos y variables. Meses para alcanzar el punto de equilibrio (PE = Costos Fijos / (Ingreso mensual - Costo variable mensual)). Una proyección breve por escenario en 1-2 oraciones: optimista, base y pesimista.

GARANTÍAS: Indica si las bases exigen boleta de garantía u otra caución, su monto o porcentaje, plazo de vigencia y las condiciones de ejecución (cuándo se pierde). Si no se menciona, indicarlo.

RIESGOS: Los 3 riesgos más relevantes, uno por párrafo, en una oración cada uno. Incluye el riesgo de perder la boleta de garantía si aplica.

OPORTUNIDADES: Las 2-3 ventajas competitivas más importantes, en un párrafo.

RECOMENDACIÓN: Postular o no postular, con justificación en 2-3 oraciones.

PREGUNTAS PARA EL EQUIPO: Lista las preguntas críticas que el equipo debe responder internamente antes de decidir. Incluye obligatoriamente estas si no fueron respondidas con los documentos disponibles:
- ¿Tenemos caja suficiente para cubrir la boleta de garantía requerida sin afectar la operación?
- Si se retrasa el proyecto y perdemos la boleta de garantía, ¿qué tanto nos afecta financieramente?
- ¿Está todo claro en las bases, o hay ambigüedades que convendrá aclarar antes de ofertar?
Agrega otras preguntas específicas de esta licitación que consideres críticas. Una por párrafo.

Al final del texto incluye exactamente el siguiente bloque JSON (no lo omitas). Si no puedes estimar algún valor, usa null. Las monedas deben ser en CLP o la moneda del contrato:

```json
{
  "breakeven": {
    "costo_fijo": <número o null>,
    "precio_unitario": <ingreso mensual o null>,
    "costo_variable_unitario": <costo variable mensual o null>,
    "unidades_punto_equilibrio": <meses para alcanzar PE (escenario base) o null>,
    "meses_optimista": <meses hasta PE escenario optimista o null>,
    "meses_base": <meses hasta PE escenario base o null>,
    "meses_pesimista": <meses hasta PE escenario pesimista o null>,
    "ingreso_total_contrato": <valor total estimado del contrato o null>
  },
  "curvas": {
    "meses_total": <duración total del contrato en meses>,
    "optimista": {
      "costo_fijo": <costos fijos totales en este escenario>,
      "ingreso_mensual": <ingreso mensual en este escenario>,
      "costo_variable_mensual": <costo variable mensual en este escenario>,
      "descripcion": "<supuesto principal: ej. precio negociado alto, costos controlados>"
    },
    "base": {
      "costo_fijo": <número>,
      "ingreso_mensual": <número>,
      "costo_variable_mensual": <número>,
      "descripcion": "<supuesto principal>"
    },
    "pesimista": {
      "costo_fijo": <número>,
      "ingreso_mensual": <número>,
      "costo_variable_mensual": <número>,
      "descripcion": "<supuesto principal: ej. sobrecostos operativos, ingresos reducidos>"
    }
  }
}
```

Sé directo y usa cifras concretas cuando puedas inferirlas."""


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
    parts, total = [], 0
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


def _extract_data(text: str) -> tuple[str, dict, dict]:
    """Extrae el bloque JSON del texto del LLM. Devuelve (texto_limpio, breakeven, curvas)."""
    pattern = r"```json\s*(\{.*?\})\s*```"
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        return text, {}, {}
    clean_text = text[: match.start()].rstrip()
    try:
        data = json.loads(match.group(1))
        return clean_text, data.get("breakeven", {}), data.get("curvas", {})
    except json.JSONDecodeError:
        return clean_text, {}, {}


def _to_float(val) -> Optional[float]:
    try:
        return float(val) if val is not None else None
    except (TypeError, ValueError):
        return None


def analyze_licitacion(db: Session, org_id: int, licitacion_id: int, *, user_id: int) -> dict:
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY no configurada. Agrega la clave al archivo .env del backend.",
        )

    lic_file_ids = [
        row[0]
        for row in db.query(FileEntry.id).filter(
            FileEntry.organization_id == org_id,
            FileEntry.licitacion_id == licitacion_id,
        ).all()
    ]
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
        f"[ANALYSIS] licitacion_id={licitacion_id} | lic_chars={len(lic_text)} | "
        f"company_chars={len(company_text)} | model={OPENAI_MODEL}"
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
        raw_answer = response.choices[0].message.content or ""
        tokens_used = response.usage.total_tokens if response.usage else None
        if response.usage:
            from app.services.token_usage_service import record_usage
            record_usage(
                db,
                organization_id=org_id,
                user_id=user_id,
                usage_type="analysis",
                model=OPENAI_MODEL,
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens,
                total_tokens=tokens_used,
            )
    except OpenAIError as e:
        LOGGER.error(f"[ANALYSIS] OpenAI error: {e}")
        raise HTTPException(status_code=502, detail=f"Error al llamar a OpenAI: {e}")

    clean_answer, bk, curvas = _extract_data(raw_answer)

    registro = AnalisisLicitacion(
        licitacion_id=licitacion_id,
        organization_id=org_id,
        analisis=clean_answer,
        model=OPENAI_MODEL,
        tokens_usados=tokens_used,
        archivos_licitacion_ids=lic_file_ids,
        archivos_empresa_ids=company_file_ids,
        breakeven_costo_fijo=_to_float(bk.get("costo_fijo")),
        breakeven_precio_unitario=_to_float(bk.get("precio_unitario")),
        breakeven_costo_variable_unitario=_to_float(bk.get("costo_variable_unitario")),
        breakeven_unidades=_to_float(bk.get("unidades_punto_equilibrio")),
        breakeven_meses_optimista=_to_float(bk.get("meses_optimista")),
        breakeven_meses_base=_to_float(bk.get("meses_base")),
        breakeven_meses_pesimista=_to_float(bk.get("meses_pesimista")),
        ingreso_total_contrato=_to_float(bk.get("ingreso_total_contrato")),
        curvas_data=curvas if curvas else None,
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)

    result = {
        "id": registro.id,
        "analisis": registro.analisis,
        "model": registro.model,
        "tokens_usados": registro.tokens_usados,
        "chunks_licitacion": len(lic_file_ids),
        "chunks_empresa": len(company_file_ids),
        "archivos_licitacion_ids": lic_file_ids,
        "archivos_empresa_ids": company_file_ids,
        "breakeven_costo_fijo": registro.breakeven_costo_fijo,
        "breakeven_precio_unitario": registro.breakeven_precio_unitario,
        "breakeven_costo_variable_unitario": registro.breakeven_costo_variable_unitario,
        "breakeven_unidades": registro.breakeven_unidades,
        "breakeven_meses_optimista": registro.breakeven_meses_optimista,
        "breakeven_meses_base": registro.breakeven_meses_base,
        "breakeven_meses_pesimista": registro.breakeven_meses_pesimista,
        "ingreso_total_contrato": registro.ingreso_total_contrato,
        "curvas_data": registro.curvas_data,
        "created_at": registro.created_at.isoformat(),
    }

    # Post-EVA: analyze active simulaciones
    from app.models.simulacion import Simulacion
    from app.services import simulacion_service

    active_sims = (
        db.query(Simulacion)
        .filter(
            Simulacion.licitacion_id == licitacion_id,
            Simulacion.organization_id == org_id,
            Simulacion.is_active.is_(True),
        )
        .all()
    )

    sim_results = []
    sim_errors = []
    for sim in active_sims:
        try:
            analisis_sim = simulacion_service.analyze_simulacion(
                db, org_id, licitacion_id, sim.id, user_id=user_id,
            )
            sim_results.append({
                "simulacion_id": sim.id,
                "simulacion_nombre": sim.nombre,
                "analisis_id": analisis_sim.id,
                "analisis": analisis_sim.analisis,
                "curva_data": analisis_sim.curva_data,
                "tokens_usados": analisis_sim.tokens_usados,
            })
        except Exception as e:
            LOGGER.warning(f"[ANALYSIS] Simulacion {sim.id} failed: {e}")
            sim_errors.append({
                "simulacion_id": sim.id,
                "simulacion_nombre": sim.nombre,
                "error": str(e),
            })

    result["simulaciones_analisis"] = sim_results
    result["simulaciones_errores"] = sim_errors

    return result


def get_analisis_history(db: Session, org_id: int, licitacion_id: int) -> list:
    return (
        db.query(AnalisisLicitacion)
        .filter(
            AnalisisLicitacion.organization_id == org_id,
            AnalisisLicitacion.licitacion_id == licitacion_id,
        )
        .order_by(AnalisisLicitacion.created_at.desc())
        .all()
    )
