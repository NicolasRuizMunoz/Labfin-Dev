# app/model_client.py
import httpx
from .settings import settings

class ModelBackendError(RuntimeError):
    pass

def _endpoint() -> str:
    base = settings.OLLAMA_BASE_URL.rstrip("/")
    return f"{base}/api/generate"

async def generate_text(system_prompt: str, user_prompt: str) -> str:
    payload = {
        "model": settings.OLLAMA_MODEL,
        "system": system_prompt,
        "prompt": user_prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_ctx": 2048,   # antes 4096
            "num_gpu": 0       # ⬅️ CPU
        }
    }
    try:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
            r = await client.post(_endpoint(), json=payload)
            r.raise_for_status()
            data = r.json()
            txt = (data or {}).get("response", "")
            if not isinstance(txt, str) or not txt.strip():
                raise ModelBackendError(f"Respuesta vacía/ inválida desde Ollama: {data!r}")
            return txt.strip()
    except httpx.HTTPStatusError as e:
        body = e.response.text if e.response is not None else ""
        raise ModelBackendError(f"Ollama HTTP {e.response.status_code if e.response else '?'}: {body}") from e
    except httpx.RequestError as e:
        raise ModelBackendError(f"Request a Ollama falló: {e}") from e
    except Exception as e:
        raise ModelBackendError(f"Error inesperado conversando con Ollama: {e}") from e
