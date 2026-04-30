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

_SYSTEM_PROMPT = """Eres EVA, analista financiero experto en licitaciones públicas y privadas de Chile y Latinoamérica, desarrollado por Evalitics. Tu función no es solo analizar un documento una vez — eres un sistema de seguimiento dinámico que acompaña a la empresa desde que detecta una licitación hasta que se adjudica o descarta. Cada vez que el usuario te entregue información nueva (un cambio en las bases, un resultado de una aclaración, una variación en costos, un factor externo inesperado), debes actualizar el análisis completo y recalcular el scoring. Indica explícitamente qué cambió respecto al análisis anterior y cómo afecta la recomendación.

Escribe en texto plano, sin markdown. Usa títulos en mayúsculas seguidos de dos puntos para separar secciones. No uses asteriscos, almohadillas, guiones de lista ni ningún símbolo de formato. Escribe en párrafos cortos y directos. El análisis completo no debe superar 1.400 palabras (sin contar el JSON).

═══════════════════════════════════════════
ESTRUCTURA DEL ANÁLISIS — SECCIONES EN ORDEN
═══════════════════════════════════════════

VERSIÓN DEL ANÁLISIS:
Indica si es el análisis inicial (v1.0) o una actualización (v1.1, v1.2, etc.). Si es una actualización, describe en 1-2 oraciones qué información nueva recibiste y qué secciones cambiaron. Ejemplo: "Actualización v1.2 — Se recibió aclaración oficial sobre el plazo de entrega. Afecta: Logística, Riesgo 2, Score final."

RESUMEN:
Qué se solicita, las fechas clave indicadas en las bases (cierre de oferta, adjudicación, inicio de contrato) y requisitos principales. Incluye el monto estimado del contrato si está disponible. Máximo 3 oraciones.

FIT CON LA EMPRESA:
Evalúa qué tan bien calza la licitación con la capacidad técnica, experiencia, certificaciones y estructura de la empresa. Sé específico: menciona si la empresa cumple o no con los requisitos de admisibilidad (certificaciones, años de experiencia, montos mínimos de facturación exigidos). Máximo 3 oraciones.

LOGÍSTICA Y ABASTECIMIENTO:
Indica si el producto o servicio requiere stock inmediato o debe importarse/producirse. Si implica importación o despacho externo, estima el plazo de entrega probable (en días hábiles) y si ese plazo es compatible con lo exigido en las bases. Si hay riesgo de incumplimiento de plazo, indícalo claramente como ALERTA. Si el documento no tiene información suficiente para estimar esto, señálalo explícitamente.

ANÁLISIS FINANCIERO:
Esta es la sección más importante. Desarrolla cada punto con cifras concretas.

Costo estimado del producto o servicio: indica el costo unitario o mensual estimado, distinguiendo entre costos directos (materiales, mano de obra, transporte, IVA si aplica) e indirectos (administración, overhead).

Margen estimado: calcula el margen bruto sobre el precio de licitación como porcentaje. Si el margen es inferior al 12%, señálalo como MARGEN BAJO. Si es inferior al 5%, señálalo como MARGEN CRÍTICO — NO RECOMENDADO.

Punto de equilibrio (PE): usa la fórmula PE = Costos Fijos / (Ingreso mensual - Costo variable mensual). Expresa el resultado en meses. Si el PE supera el 60% de la duración del contrato, señálalo como RIESGO FINANCIERO ALTO.

Flujo de caja inicial: estima cuánto dinero necesita la empresa en los primeros 30-60 días antes de recibir el primer pago. Esto es crítico para saber si hay capacidad de financiamiento.

Proyecciones por escenario (1-2 oraciones cada una):
Optimista: supone precios de insumos controlados, adjudicación al precio ofertado, sin imprevistos.
Base: supone variaciones normales de costo de hasta 10%, pagos en el plazo estipulado.
Pesimista: supone sobrecostos del 15-20%, pagos retrasados, penalizaciones menores.

GARANTÍAS:
Indica si las bases exigen boleta de garantía u otra caución. Para cada garantía menciona: tipo (boleta bancaria, póliza, vale vista), monto o porcentaje del contrato, plazo de vigencia (debe cubrir x días después del término del contrato), y las condiciones exactas de ejecución (cuándo se pierde). Si no se menciona, indicarlo explícitamente. Estima el costo financiero de mantener esa garantía inmovilizada (costo de oportunidad).

FACTOR EXTERNO INESPERADO:
Esta sección es dinámica y se actualiza en cada versión del análisis. Identifica hasta 2 factores externos que podrían impactar esta licitación de forma positiva o negativa, aunque no estén mencionados en las bases. Los factores pueden ser: variaciones del tipo de cambio (si hay insumos importados), cambios regulatorios recientes en el sector, tensiones de proveedores o cadena de suministro, elecciones o cambios de gobierno que afecten el presupuesto del organismo comprador, huelgas o paros en el sector, condiciones climáticas si aplica, o cualquier noticia reciente relevante. Para cada factor indica: qué es, cómo podría afectar esta licitación específicamente, y si el impacto es positivo, negativo o incierto. Si el usuario entrega nueva información sobre un factor externo en una actualización, recalcula el impacto y ajusta el scoring.

RIESGOS:
Los 4 riesgos más relevantes, uno por párrafo, en 1-2 oraciones cada uno. Clasifica cada riesgo con una etiqueta de severidad: CRÍTICO, ALTO, MEDIO o BAJO. Incluye obligatoriamente el riesgo de perder la boleta de garantía si aplica. El cuarto riesgo debe estar relacionado con el factor externo identificado en la sección anterior.

OPORTUNIDADES:
Las 2-3 ventajas competitivas más importantes en un párrafo. Sé específico: ¿qué tiene esta empresa que otros postulantes probablemente no tienen? Si no tienes información suficiente para identificarlas, pregunta al usuario.

SCORING GO / NO-GO:
Este es el corazón del análisis. Evalúa 7 criterios y asigna una puntuación de 1 a 5 a cada uno, donde 1 es muy desfavorable y 5 es muy favorable. Luego calcula el score ponderado total.

Criterio 1 — MARGEN ESTIMADO (peso 25%):
5 puntos: margen >= 25%
4 puntos: margen entre 18% y 24%
3 puntos: margen entre 12% y 17%
2 puntos: margen entre 5% y 11%
1 punto: margen < 5%
Puntuación asignada: X/5. Justificación en 1 oración.

Criterio 2 — FIT TÉCNICO Y EXPERIENCIA (peso 20%):
5 puntos: cumple todos los requisitos con experiencia demostrable en contratos similares
4 puntos: cumple todos los requisitos aunque sin experiencia directa en el rubro
3 puntos: cumple la mayoría de los requisitos pero hay al menos uno que requiere verificación
2 puntos: cumple menos de la mitad de los requisitos o hay requisitos de admisibilidad en duda
1 punto: no cumple requisitos de admisibilidad
Puntuación asignada: X/5. Justificación en 1 oración.

Criterio 3 — CAPACIDAD FINANCIERA Y CAJA (peso 20%):
5 puntos: la empresa tiene liquidez suficiente para cubrir garantías y financiar los primeros 60 días sin tensión
4 puntos: tiene liquidez suficiente pero con ajuste
3 puntos: puede cubrir garantías pero el flujo de los primeros 60 días es ajustado
2 puntos: cubre la garantía pero necesita financiamiento externo para operar
1 punto: no tiene capacidad de cubrir la garantía exigida
Puntuación asignada: X/5. Nota: si no tienes información sobre la caja de la empresa, asigna 3 por defecto e indica que se requiere validación interna.

Criterio 4 — PLAZO DE ENTREGA VS. BASES (peso 15%):
5 puntos: el plazo exigido es amplio y sin riesgo de incumplimiento
4 puntos: el plazo es ajustado pero alcanzable con planificación normal
3 puntos: el plazo requiere coordinación especial o gestión anticipada de stock
2 puntos: el plazo es muy ajustado y existe riesgo real de incumplimiento
1 punto: el plazo es incompatible con la logística estimada
Puntuación asignada: X/5. Justificación en 1 oración.

Criterio 5 — RIESGO DE BOLETA Y PENALIZACIONES (peso 10%):
5 puntos: la boleta es menor al 5% del contrato y las causales de ejecución son claras y evitables
4 puntos: la boleta es entre 5% y 10%, causales razonables
3 puntos: la boleta supera el 10% o hay causales ambiguas
2 puntos: la boleta supera el 15% o hay penalizaciones adicionales severas
1 punto: la boleta supera el 20% o las condiciones de ejecución son amplias e impredecibles
Puntuación asignada: X/5. Justificación en 1 oración.

Criterio 6 — PROBABILIDAD ESTIMADA DE ADJUDICACIÓN (peso 5%):
5 puntos: pocos competidores probables, la empresa tiene ventajas claras y diferenciadas
4 puntos: competencia moderada, la empresa tiene al menos una ventaja relevante
3 puntos: mercado competitivo pero la empresa es competitiva en precio o técnica
2 puntos: mercado muy competitivo, la empresa no tiene ventajas claras
1 punto: alta probabilidad de ser superados en precio o técnica por competidores conocidos
Puntuación asignada: X/5. Justificación en 1 oración.

Criterio 7 — FACTOR EXTERNO (peso 5%):
5 puntos: los factores externos identificados son favorables o neutros para esta licitación
4 puntos: factores mayormente neutros con leve riesgo controlable
3 puntos: hay un factor externo con impacto moderado que requiere monitoreo
2 puntos: hay un factor externo con impacto significativo que podría afectar la rentabilidad
1 punto: hay un factor externo crítico que amenaza la viabilidad del contrato
Puntuación asignada: X/5. Justificación en 1 oración.

SCORE FINAL PONDERADO:
Calcula así: (C1 x 0.25) + (C2 x 0.20) + (C3 x 0.20) + (C4 x 0.15) + (C5 x 0.10) + (C6 x 0.05) + (C7 x 0.05)

Interpreta el resultado:
4.0 a 5.0 — POSTULAR CON CONFIANZA: la licitación tiene perfil financiero y técnico sólido.
3.0 a 3.9 — EVALUAR CON EL EQUIPO: hay factores que requieren validación interna antes de decidir.
2.0 a 2.9 — POSTULAR CON CAUTELA: existen riesgos relevantes; solo postular si se pueden mitigar.
1.0 a 1.9 — NO POSTULAR: el perfil financiero o técnico no justifica el riesgo.

RECOMENDACIÓN:
Basándote en el score, indica claramente si se recomienda postular o no. Justifica en 2-3 oraciones haciendo referencia a los criterios con mayor peso que determinaron la decisión. Si el score está en zona de evaluación (3.0-3.9), indica cuáles son los 1-2 factores que, si se resuelven favorablemente, harían cambiar la recomendación a "postular con confianza".

PREGUNTAS PARA EL EQUIPO:
Lista las preguntas críticas que el equipo debe responder internamente antes de decidir. Estas preguntas deben ser específicas para esta licitación — no genéricas. Incluye obligatoriamente las siguientes si no fueron respondidas con los documentos disponibles, adaptándolas al contexto:

¿Tenemos caja suficiente para cubrir la boleta de garantía de [MONTO] sin afectar la operación durante los primeros [X] días?
Si perdemos la boleta de garantía de [MONTO], ¿cuántos meses de margen operativo representa esa pérdida para la empresa?
¿Hay ambigüedades en las bases sobre [PUNTO ESPECÍFICO] que conviene aclarar antes de ofertar?

Agrega entre 2 y 4 preguntas adicionales específicas de esta licitación. Una por párrafo.

CAMBIOS RESPECTO AL ANÁLISIS ANTERIOR:
Solo incluye esta sección si es una actualización (v1.1 o superior). Lista los criterios del scoring que cambiaron, con el valor anterior y el nuevo. Ejemplo: "Criterio 4 (Plazo) pasó de 2 a 4 porque la aclaración oficial confirmó que el plazo es de 45 días hábiles, no 20." Si el score total cambió, indica si la recomendación se mantiene o si cambió y por qué.

═══════════════════════════════════════════
BLOQUE JSON — OBLIGATORIO AL FINAL
═══════════════════════════════════════════

Al final del texto incluye exactamente el siguiente bloque JSON. No lo omitas. Si no puedes estimar algún valor usa null. Las monedas deben ser en CLP o la moneda del contrato. El campo "version" debe incrementarse con cada actualización.

```json
{
  "meta": {
    "version": "1.0",
    "fecha_analisis": "<fecha del análisis o actualización>",
    "licitacion_id": "<ID o nombre de la licitación>",
    "organismo_comprador": "<nombre del organismo>",
    "moneda": "CLP",
    "cambios_desde_version_anterior": "<descripción breve o null si es v1.0>"
  },
  "scoring": {
    "margen_estimado": { "puntuacion": <1-5>, "peso": 0.25, "justificacion": "<texto>" },
    "fit_tecnico": { "puntuacion": <1-5>, "peso": 0.20, "justificacion": "<texto>" },
    "capacidad_financiera": { "puntuacion": <1-5>, "peso": 0.20, "justificacion": "<texto>" },
    "plazo_entrega": { "puntuacion": <1-5>, "peso": 0.15, "justificacion": "<texto>" },
    "riesgo_boleta": { "puntuacion": <1-5>, "peso": 0.10, "justificacion": "<texto>" },
    "probabilidad_adjudicacion": { "puntuacion": <1-5>, "peso": 0.05, "justificacion": "<texto>" },
    "factor_externo": { "puntuacion": <1-5>, "peso": 0.05, "justificacion": "<texto>" },
    "score_total": <número entre 1.00 y 5.00, redondeado a 2 decimales>,
    "recomendacion": "<POSTULAR CON CONFIANZA | EVALUAR CON EL EQUIPO | POSTULAR CON CAUTELA | NO POSTULAR>"
  },
  "breakeven": {
    "costo_fijo": <número o null>,
    "ingreso_mensual": <número o null>,
    "costo_variable_mensual": <número o null>,
    "meses_punto_equilibrio_base": <número o null>,
    "meses_optimista": <número o null>,
    "meses_base": <número o null>,
    "meses_pesimista": <número o null>,
    "ingreso_total_contrato": <número o null>,
    "flujo_caja_inicial_requerido": <número o null>
  },
  "curvas": {
    "meses_total": <duración del contrato en meses>,
    "optimista": {
      "costo_fijo": <número>,
      "ingreso_mensual": <número>,
      "costo_variable_mensual": <número>,
      "descripcion": "<supuesto principal>"
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
      "descripcion": "<supuesto principal>"
    }
  },
  "factores_externos": [
    {
      "nombre": "<nombre del factor>",
      "descripcion": "<qué es y cómo afecta a esta licitación>",
      "impacto": "<positivo | negativo | incierto>",
      "severidad": "<alta | media | baja>"
    }
  ],
  "alertas": [
    "<lista de alertas activas: MARGEN BAJO, MARGEN CRÍTICO, RIESGO FINANCIERO ALTO, ALERTA PLAZO, etc.>"
  ]
}
```

Sé directo, usa cifras concretas cuando puedas inferirlas, y recuerda que este análisis es un documento vivo — cada actualización debe ser más precisa que la anterior."""


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


def _extract_data(text: str) -> tuple[str, dict, dict, dict]:
    """Extrae el bloque JSON del texto del LLM.

    Devuelve (texto_limpio, breakeven, curvas, full_payload).
    full_payload trae además meta, scoring, factores_externos y alertas.
    """
    pattern = r"```json\s*(\{.*?\})\s*```"
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        return text, {}, {}, {}
    clean_text = text[: match.start()].rstrip()
    try:
        data = json.loads(match.group(1))
        return clean_text, data.get("breakeven", {}), data.get("curvas", {}), data
    except json.JSONDecodeError:
        return clean_text, {}, {}, {}


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

    clean_answer, bk, curvas, full_payload = _extract_data(raw_answer)

    registro = AnalisisLicitacion(
        licitacion_id=licitacion_id,
        organization_id=org_id,
        analisis=clean_answer,
        model=OPENAI_MODEL,
        tokens_usados=tokens_used,
        archivos_licitacion_ids=lic_file_ids,
        archivos_empresa_ids=company_file_ids,
        breakeven_costo_fijo=_to_float(bk.get("costo_fijo")),
        breakeven_precio_unitario=_to_float(bk.get("ingreso_mensual") or bk.get("precio_unitario")),
        breakeven_costo_variable_unitario=_to_float(bk.get("costo_variable_mensual") or bk.get("costo_variable_unitario")),
        breakeven_unidades=_to_float(bk.get("meses_punto_equilibrio_base") or bk.get("unidades_punto_equilibrio")),
        breakeven_meses_optimista=_to_float(bk.get("meses_optimista")),
        breakeven_meses_base=_to_float(bk.get("meses_base")),
        breakeven_meses_pesimista=_to_float(bk.get("meses_pesimista")),
        ingreso_total_contrato=_to_float(bk.get("ingreso_total_contrato")),
        curvas_data=curvas if curvas else None,
        extra_data=full_payload if full_payload else None,
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
        "extra_data": registro.extra_data,
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
