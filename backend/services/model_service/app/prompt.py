import textwrap
from typing import List, Dict


def _approx_token_count(text: str) -> int:
    """
    Aproximación simple de tokens: cantidad de 'palabras' separadas por espacio.
    No es exacto al tokenizer del modelo, pero sirve de proxy para debug.
    """
    return len(text.split())


def _dedupe_sources(sources: List[Dict]) -> List[Dict]:
    """
    Deduplica fuentes que vienen del MISMO texto.
    Prioriza:
      - s3_key_processed (mismo procesado)
      - si no hay, uri
      - si no hay, file_name
    Si dos entradas comparten esa 'clave', solo se mantiene la primera.
    """
    seen = set()
    deduped: List[Dict] = []
    for s in sources:
        key = (
            s.get("s3_key_processed")
            or s.get("uri")
            or s.get("file_name")
        )
        if not key:
            # Si no hay nada identificador, se considera única
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
    """
    Versión simple basada en FRAGMENTOS.
    'sources' es una lista de dicts con claves: file_name, score, uri, fragment, s3_key_processed (opcional).
    """
    # 1) Deduplicar fuentes antes de construir el prompt
    deduped_sources = _dedupe_sources(sources)

    body: List[str] = [
        "Consulta del usuario:",
        query.strip(),
        "",
        "Contexto proporcionado:",
    ]

    for i, s in enumerate(deduped_sources, start=1):
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

    user_prompt = "\n".join(body)

    # --- DEBUG: largo y tokens aproximados ---
    total_chars = len(user_prompt)
    total_tokens = _approx_token_count(user_prompt)
    print(
        f"[PROMPT_DEBUG] user_prompt_chars={total_chars} "
        f"user_prompt_tokens≈{total_tokens} "
        f"raw_sources={len(sources)} deduped_sources={len(deduped_sources)}",
        flush=True,
    )

    return user_prompt


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
    user_prompt = "\n".join(body)

    # DEBUG también aquí si lo llegas a usar
    total_chars = len(user_prompt)
    total_tokens = _approx_token_count(user_prompt)
    print(
        f"[PROMPT_DEBUG_FILES] user_prompt_chars={total_chars} user_prompt_tokens≈{total_tokens} "
        f"sources_with_text={len(sources_with_text)}",
        flush=True,
    )

    return user_prompt


def build_user_prompt_fallback(query: str, sources: List[Dict], max_chars_per_chunk: int) -> str:
    # Reutiliza la misma lógica para que dedupe + logs sean consistentes
    return build_user_prompt(query, sources, max_chars_per_chunk)
