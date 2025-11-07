// src/services/chat.ts
import type { ChatMessage, ChatSession } from "@/types/chat";

const BASE = "/api/chat";

function authHeader(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const resp = await fetch(input, init);
  const contentType = resp.headers.get("content-type") || "";
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${text}`);
  }
  if (contentType.includes("application/json")) {
    return resp.json() as Promise<T>;
  }
  // vacío o distinto de JSON
  return null as unknown as T;
}

// --------- Sesiones ---------

export async function createSession(title?: string): Promise<ChatSession> {
  return http<ChatSession>(`${BASE}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ title }),
  });
}

export async function listSessions(params?: { limit?: number; offset?: number }): Promise<ChatSession[]> {
  const qp = new URLSearchParams();
  if (params?.limit) qp.set("limit", String(params.limit));
  if (params?.offset) qp.set("offset", String(params.offset));
  const url = `${BASE}/sessions${qp.toString() ? `?${qp.toString()}` : ""}`;
  return http<ChatSession[]>(url, { headers: { ...authHeader() } });
}

export async function getSession(sessionId: number): Promise<ChatSession> {
  return http<ChatSession>(`${BASE}/sessions/${sessionId}`, {
    headers: { ...authHeader() },
  });
}

export async function deleteSession(sessionId: number): Promise<void> {
  await http<void>(`${BASE}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
}

// --------- Mensajes ---------

export async function listMessages(sessionId: number, params?: { limit?: number; offset?: number; asc?: boolean }): Promise<ChatMessage[]> {
  const qp = new URLSearchParams();
  if (params?.limit) qp.set("limit", String(params.limit));
  if (params?.offset) qp.set("offset", String(params.offset));
  if (params?.asc !== undefined) qp.set("asc", params.asc ? "true" : "false");
  const url = `${BASE}/sessions/${sessionId}/messages${qp.toString() ? `?${qp.toString()}` : ""}`;
  return http<ChatMessage[]>(url, { headers: { ...authHeader() } });
}

/**
 * Envía mensaje del usuario y devuelve la RESPUESTA DEL ASISTENTE (ya que el backend guarda ambos).
 */
export async function postUserMessage(sessionId: number, message: string): Promise<ChatMessage> {
  return http<ChatMessage>(`${BASE}/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ message }),
  });
}
