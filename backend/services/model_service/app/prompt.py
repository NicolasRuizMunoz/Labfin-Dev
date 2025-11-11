import textwrap
from typing import List, Dict

def build_system_prompt() -> str:
    return (
        "Eres un asistente tributario/financiero. Responde únicamente con la información "
        "proporcionada en las fuentes. Si algo no está en las fuentes, indícalo explícitamente."
    )

def build_user_prompt(query: str, sources: List[Dict], max_chars_per_chunk: int) -> str:
    """
    Versión simple basada en FRAGMENTOS (coincide con tu main.py actual).
    'sources' es una lista de dicts con claves: file_name, score, uri, fragment.
    """
    body = ["Consulta del usuario:", query.strip(), "", "Contexto proporcionado:"]
    for i, s in enumerate(sources, start=1):
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

# (Opcional) Si luego usas descarga S3 y contexto de archivos completos, ya tienes estas variantes disponibles.
def build_user_prompt_from_files(query: str, sources_with_text: List[Dict], max_chars_per_file: int) -> str:
    body = ["Consulta del usuario:", query.strip(), "", "Contexto proporcionado:"]
    for s in sources_with_text:
        text = (s.get("text") or "").strip()
        if len(text) > max_chars_per_file:
            text = text[:max_chars_per_file] + "..."
        body.append(textwrap.dedent(f"""
        [{s['index']}] Fuente: {s['file_name']}
            Relevancia: {s['score']:.4f}
            URI: {s['uri']}
            CONTENIDO (procesado):
            {text}
        """).strip())
    body.append("")
    body.append("Instrucciones: Cita las fuentes como [1], [2], etc. cuando corresponda.")
    return "\n".join(body)

def build_user_prompt_fallback(query: str, sources: List[Dict], max_chars_per_chunk: int) -> str:
    # Misma implementación que build_user_prompt para fallback explícito
    return build_user_prompt(query, sources, max_chars_per_chunk)
