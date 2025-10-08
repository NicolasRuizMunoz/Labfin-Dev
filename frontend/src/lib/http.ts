export const API = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });

  const isJSON = res.headers.get('content-type')?.includes('application/json');
  const body = isJSON ? await res.json().catch(() => null) : await res.text().catch(() => '');

  if (!res.ok) {
    const msg = isJSON ? (body?.detail || body?.message || res.statusText) : res.statusText;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return body as T;
}

export default http; // 👈 export por defecto
