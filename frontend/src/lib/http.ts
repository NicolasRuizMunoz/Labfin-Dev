export const API = import.meta.env.VITE_API_BASE_URL ?? '/api';

function isFormData(body: any): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // Deduplicate: if a refresh is already in flight, reuse it
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API}/users/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function rawFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { headers: hdrs, body } = init;
  const headers: HeadersInit = { ...(hdrs || {}) };

  if (!isFormData(body) && !('Content-Type' in (headers as any))) {
    (headers as any)['Content-Type'] = 'application/json';
  }

  return fetch(`${API}${path}`, {
    credentials: 'include',
    headers,
    ...init,
  });
}

export default async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await rawFetch(path, init);

  // If 401 and not already a refresh/login/register call, try refreshing
  if (res.status === 401 && !path.startsWith('/users/refresh') && !path.startsWith('/users/login') && !path.startsWith('/users/register')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Retry the original request with the new cookie
      res = await rawFetch(path, init);
    }
  }

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
