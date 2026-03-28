from openai import AsyncOpenAI
from app.config import OPENAI_API_KEY, OPENAI_MODEL


class ModelBackendError(RuntimeError):
    pass


async def generate_text(system_prompt: str, user_prompt: str) -> str:
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    try:
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=512,
        )
        txt = response.choices[0].message.content or ""
        if not txt.strip():
            raise ModelBackendError("Empty response from OpenAI")
        return txt.strip()
    except ModelBackendError:
        raise
    except Exception as e:
        raise ModelBackendError(f"OpenAI request failed: {e}") from e
