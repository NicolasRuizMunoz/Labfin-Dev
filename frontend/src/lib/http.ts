export const API = import.meta.env.VITE_API_BASE_URL ?? '/api';

function isFormData(body: any): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

export default async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { headers: hdrs, body } = init;
  const headers: HeadersInit = { ...(hdrs || {}) };

  if (!isFormData(body) && !('Content-Type' in (headers as any))) {
    (headers as any)['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers,
    ...init,
  });

  const ct = res.headers.get('content-type') || '';
  const isJSON = ct.includes('application/json');
  const raw = isJSON ? await res.json().catch(() => null)
                     : await res.text().catch(() => '');

  if (!res.ok) {
    const msg = isJSON ? (raw?.detail || raw?.message || res.statusText) : res.statusText;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return raw as T;
}
