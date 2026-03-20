"""
CRUD de simulaciones + análisis con OpenAI.
"""
import json
import logging
import re
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from openai import OpenAI, OpenAIError

from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.models.escenario import Escenario
from app.models.simulacion import Simulacion, SimulacionEscenario, AnalisisSimulacion
from app.models.analisis_licitacion import AnalisisLicitacion
from app.schemas.simulacion import SimulacionCreate, SimulacionUpdate

LOGGER = logging.getLogger(__name__)

DEFAULT_COLORS = ["#f97316", "#06b6d4", "#a855f7", "#ec4899", "#14b8a6", "#eab308"]
MAX_ESCENARIOS_PER_SIMULACION = 10


def _auto_color(db: Session, lic_id: int) -> str:
    used = (
        db.query(Simulacion.color)
        .filter(Simulacion.licitacion_id == lic_id, Simulacion.color.isnot(None))
        .all()
    )
    used_set = {r[0] for r in used}
    for c in DEFAULT_COLORS:
        if c not in used_set:
            return c
    return DEFAULT_COLORS[0]


def _load_simulacion(db: Session, org_id: int, lic_id: int, sim_id: int) -> Simulacion:
    sim = (
        db.query(Simulacion)
        .options(
            joinedload(Simulacion.simulacion_escenarios).joinedload(SimulacionEscenario.escenario),
            joinedload(Simulacion.analisis),
        )
        .filter(
            Simulacion.id == sim_id,
            Simulacion.licitacion_id == lic_id,
            Simulacion.organization_id == org_id,
        )
        .first()
    )
    if not sim:
        raise HTTPException(status_code=404, detail="Simulación no encontrada")
    return sim


def create(db: Session, org_id: int, user_id: int, lic_id: int, data: SimulacionCreate) -> Simulacion:
    if not data.escenario_ids:
        raise HTTPException(status_code=400, detail="Debe incluir al menos un escenario")
    if len(data.escenario_ids) > MAX_ESCENARIOS_PER_SIMULACION:
        raise HTTPException(status_code=400, detail=f"Máximo {MAX_ESCENARIOS_PER_SIMULACION} escenarios por simulación")

    # Validate all escenarios exist in org
    escenarios = (
        db.query(Escenario)
        .filter(Escenario.id.in_(data.escenario_ids), Escenario.organization_id == org_id)
        .all()
    )
    if len(escenarios) != len(set(data.escenario_ids)):
        raise HTTPException(status_code=400, detail="Uno o más escenarios no encontrados en la organización")

    color = data.color or _auto_color(db, lic_id)

    sim = Simulacion(
        licitacion_id=lic_id,
        organization_id=org_id,
        nombre=data.nombre,
        color=color,
        is_active=True,
        created_by=user_id,
    )
    db.add(sim)
    db.flush()

    for esc_id in set(data.escenario_ids):
        db.add(SimulacionEscenario(simulacion_id=sim.id, escenario_id=esc_id))

    db.commit()
    db.refresh(sim)
    return _load_simulacion(db, org_id, lic_id, sim.id)


def get_all_for_licitacion(db: Session, org_id: int, lic_id: int) -> List[Simulacion]:
    return (
        db.query(Simulacion)
        .options(
            joinedload(Simulacion.simulacion_escenarios).joinedload(SimulacionEscenario.escenario),
            joinedload(Simulacion.analisis),
        )
        .filter(Simulacion.licitacion_id == lic_id, Simulacion.organization_id == org_id)
        .order_by(Simulacion.created_at.desc())
        .all()
    )


def update(db: Session, org_id: int, lic_id: int, sim_id: int, data: SimulacionUpdate) -> Simulacion:
    sim = _load_simulacion(db, org_id, lic_id, sim_id)

    if data.nombre is not None:
        sim.nombre = data.nombre
    if data.color is not None:
        sim.color = data.color
    if data.is_active is not None:
        sim.is_active = data.is_active

    if data.escenario_ids is not None:
        if not data.escenario_ids:
            raise HTTPException(status_code=400, detail="Debe incluir al menos un escenario")
        if len(data.escenario_ids) > MAX_ESCENARIOS_PER_SIMULACION:
            raise HTTPException(status_code=400, detail=f"Máximo {MAX_ESCENARIOS_PER_SIMULACION} escenarios por simulación")

        escenarios = (
            db.query(Escenario)
            .filter(Escenario.id.in_(data.escenario_ids), Escenario.organization_id == org_id)
            .all()
        )
        if len(escenarios) != len(set(data.escenario_ids)):
            raise HTTPException(status_code=400, detail="Uno o más escenarios no encontrados en la organización")

        # Replace M-to-M
        db.query(SimulacionEscenario).filter(SimulacionEscenario.simulacion_id == sim_id).delete()
        for esc_id in set(data.escenario_ids):
            db.add(SimulacionEscenario(simulacion_id=sim_id, escenario_id=esc_id))

    db.commit()
    db.refresh(sim)
    return _load_simulacion(db, org_id, lic_id, sim_id)


def delete(db: Session, org_id: int, lic_id: int, sim_id: int) -> None:
    sim = _load_simulacion(db, org_id, lic_id, sim_id)
    db.delete(sim)
    db.commit()


def toggle_active(db: Session, org_id: int, lic_id: int, sim_id: int) -> Simulacion:
    sim = _load_simulacion(db, org_id, lic_id, sim_id)
    sim.is_active = not sim.is_active
    db.commit()
    db.refresh(sim)
    return _load_simulacion(db, org_id, lic_id, sim_id)


# --------------- AI Analysis ---------------

_SIMULATION_SYSTEM_PROMPT = """Eres un analista financiero experto en licitaciones públicas y privadas de Chile y Latinoamérica.

Se te entrega un análisis financiero base de una licitación con sus curvas financieras (optimista, base, pesimista) y un conjunto de escenarios hipotéticos. Tu tarea es CALCULAR nuevos valores de costo fijo, ingreso mensual y costo variable mensual que reflejen el impacto combinado de estos escenarios.

REGLAS IMPORTANTES:
- Los valores que generes DEBEN ser diferentes a los escenarios optimista, base y pesimista ya existentes. Esta simulación representa un escenario DISTINTO.
- Parte desde los valores del escenario BASE y aplica los ajustes que los escenarios hipotéticos implican (ej: si un escenario dice "costos suben 15%", multiplica el costo base por 1.15).
- Si un escenario menciona retrasos, estima su impacto en costos fijos adicionales (ej: meses extra de overhead).
- Combina los efectos de todos los escenarios simultáneamente.
- Muestra el cálculo paso a paso antes de dar los valores finales.

Escribe en texto plano, sin markdown. Sé directo y usa cifras concretas. Máximo 500 palabras.

Al final del texto incluye exactamente el siguiente bloque JSON con los valores CALCULADOS:

```json
{
  "curva": {
    "costo_fijo": <costos fijos ajustados en CLP - DEBE ser diferente al base>,
    "ingreso_mensual": <ingreso mensual ajustado en CLP - DEBE ser diferente al base si aplica>,
    "costo_variable_mensual": <costo variable mensual ajustado en CLP - DEBE ser diferente al base>,
    "descripcion": "<descripción breve de esta simulación>"
  }
}
```

Si no puedes estimar algún valor, usa null."""


def _build_simulation_prompt(
    eva_analisis: str,
    curvas_data: dict,
    escenarios: list,
) -> str:
    curvas_str = json.dumps(curvas_data, ensure_ascii=False, indent=2) if curvas_data else "(sin datos de curvas base)"

    escenarios_text = ""
    for i, esc in enumerate(escenarios, 1):
        params = json.dumps(esc.parametros, ensure_ascii=False) if esc.parametros else "Sin parámetros específicos"
        escenarios_text += f'{i}. "{esc.nombre}": {esc.descripcion}\n   Parámetros: {params}\n\n'

    # Extract base scenario values for emphasis
    base_vals = ""
    if curvas_data and isinstance(curvas_data, dict):
        base = curvas_data.get("base", {})
        if base:
            base_vals = f"""
VALORES DEL ESCENARIO BASE (usa estos como punto de partida para tus cálculos):
- Costo fijo: {base.get('costo_fijo', 'N/A')} CLP
- Ingreso mensual: {base.get('ingreso_mensual', 'N/A')} CLP
- Costo variable mensual: {base.get('costo_variable_mensual', 'N/A')} CLP
"""

    return f"""CONTEXTO DE LA LICITACIÓN:
- Análisis base:
{eva_analisis}

- Curvas existentes (optimista, base, pesimista):
{curvas_str}
{base_vals}
ESCENARIOS COMBINADOS EN ESTA SIMULACIÓN:
{escenarios_text}
Calcula nuevos valores de costo_fijo, ingreso_mensual y costo_variable_mensual que reflejen el impacto COMBINADO de estos escenarios. Los valores DEBEN ser distintos a los ya existentes (optimista, base, pesimista). Muestra el cálculo paso a paso."""


def _extract_simulation_data(text: str) -> tuple[str, dict]:
    """Extrae el bloque JSON de curva del texto. Devuelve (texto_limpio, curva_data)."""
    pattern = r"```json\s*(\{.*?\})\s*```"
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        return text, {}
    clean_text = text[: match.start()].rstrip()
    try:
        data = json.loads(match.group(1))
        return clean_text, data.get("curva", {})
    except json.JSONDecodeError:
        return clean_text, {}


def analyze_simulacion(
    db: Session, org_id: int, lic_id: int, sim_id: int, *, user_id: int
) -> AnalisisSimulacion:
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY no configurada.")

    # Get latest EVA analysis
    eva = (
        db.query(AnalisisLicitacion)
        .filter(
            AnalisisLicitacion.licitacion_id == lic_id,
            AnalisisLicitacion.organization_id == org_id,
        )
        .order_by(AnalisisLicitacion.created_at.desc())
        .first()
    )
    if not eva:
        raise HTTPException(
            status_code=422,
            detail="Analiza la licitación con EVA primero antes de analizar simulaciones.",
        )

    sim = _load_simulacion(db, org_id, lic_id, sim_id)
    escenarios = [se.escenario for se in sim.simulacion_escenarios]
    if not escenarios:
        raise HTTPException(status_code=400, detail="La simulación no tiene escenarios asociados")

    user_prompt = _build_simulation_prompt(
        eva_analisis=eva.analisis,
        curvas_data=eva.curvas_data or {},
        escenarios=escenarios,
    )

    LOGGER.info(
        f"[SIM_ANALYSIS] simulacion_id={sim_id} | licitacion_id={lic_id} | "
        f"escenarios={len(escenarios)} | model={OPENAI_MODEL}"
    )

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": _SIMULATION_SYSTEM_PROMPT},
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
                usage_type="scenario_analysis",
                model=OPENAI_MODEL,
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens,
                total_tokens=tokens_used,
            )
    except OpenAIError as e:
        LOGGER.error(f"[SIM_ANALYSIS] OpenAI error: {e}")
        raise HTTPException(status_code=502, detail=f"Error al llamar a OpenAI: {e}")

    clean_answer, curva_data = _extract_simulation_data(raw_answer)

    registro = AnalisisSimulacion(
        simulacion_id=sim_id,
        organization_id=org_id,
        analisis=clean_answer,
        model=OPENAI_MODEL,
        tokens_usados=tokens_used,
        curva_data=curva_data if curva_data else None,
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)

    return registro


def get_analisis_history(db: Session, org_id: int, lic_id: int, sim_id: int) -> List[AnalisisSimulacion]:
    # Validate ownership
    _load_simulacion(db, org_id, lic_id, sim_id)
    return (
        db.query(AnalisisSimulacion)
        .filter(
            AnalisisSimulacion.simulacion_id == sim_id,
            AnalisisSimulacion.organization_id == org_id,
        )
        .order_by(AnalisisSimulacion.created_at.desc())
        .all()
    )
