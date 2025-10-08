export const API = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include", // cookies httpOnly del gateway
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).detail ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}
