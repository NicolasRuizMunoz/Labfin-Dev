import httpx
from app.config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT


class ModelBackendError(RuntimeError):
    pass


async def generate_text(system_prompt: str, user_prompt: str) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "system": system_prompt,
        "prompt": user_prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_ctx": 1024,
            "num_predict": 512,
            "num_gpu": 0,
        },
    }
    endpoint = f"{OLLAMA_BASE_URL.rstrip('/')}/api/generate"
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            r = await client.post(endpoint, json=payload)
            r.raise_for_status()
            txt = (r.json() or {}).get("response", "")
            if not isinstance(txt, str) or not txt.strip():
                raise ModelBackendError(f"Empty/invalid response from Ollama: {r.json()!r}")
            return txt.strip()
    except httpx.HTTPStatusError as e:
        body = e.response.text if e.response is not None else ""
        raise ModelBackendError(f"Ollama HTTP {e.response.status_code}: {body}") from e
    except httpx.RequestError as e:
        raise ModelBackendError(f"Ollama request failed: {e}") from e
    except ModelBackendError:
        raise
    except Exception as e:
        raise ModelBackendError(f"Unexpected error calling Ollama: {e}") from e
