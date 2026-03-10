import textwrap
from typing import List, Dict


def _dedupe_sources(sources: List[Dict]) -> List[Dict]:
    seen = set()
    deduped: List[Dict] = []
    for s in sources:
        key = s.get("s3_key_processed") or s.get("uri") or s.get("file_name")
        if not key:
            deduped.append(s)
            continue
        if key in seen:
            continue
        seen.add(key)
        deduped.append(s)
    return deduped


def build_system_prompt() -> str:
    return (
        "Eres un asistente tributario/financiero. Responde únicamente con la información "
        "proporcionada en las fuentes. Si algo no está en las fuentes, indícalo explícitamente."
    )


def build_user_prompt(query: str, sources: List[Dict], max_chars_per_chunk: int) -> str:
    deduped = _dedupe_sources(sources)
    body: List[str] = ["Consulta del usuario:", query.strip(), "", "Contexto proporcionado:"]

    for i, s in enumerate(deduped, start=1):
        frag = (s.get("fragment") or "").strip()
        if len(frag) > max_chars_per_chunk:
            frag = frag[:max_chars_per_chunk] + "..."
        body.append(textwrap.dedent(f"""
        [{i}] Fuente: {s.get('file_name')}
            Relevancia: {s.get('score'):.4f}
            URI: {s.get('uri')}
            Fragmento:
            {frag}
        """).strip())

    body.append("")
    body.append("Instrucciones: Cita las fuentes como [1], [2], etc. cuando corresponda.")
    return "\n".join(body)
