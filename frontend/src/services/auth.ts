import { http } from "@/lib/http";

export type Me = {
  id: number; email: string; full_name?: string | null;
  empresa_id?: number | null; role_id: number; is_active: boolean;
};

type TokenPair = { access_token: string; refresh_token: string; token_type: "bearer" };

const USE_MOCK = String(import.meta.env.VITE_USE_MOCK_AUTH) === "true";

// --- MOCKS (para avanzar sin backend) ---
async function mockLogin(_: { email: string; password: string }): Promise<TokenPair> {
  return { access_token: "mock-access", refresh_token: "mock-refresh", token_type: "bearer" };
}
async function mockSignup(_: { email: string; password: string; username: string }): Promise<{ id: number }> {
  return { id: 1 };
}
async function mockMe(): Promise<Me> {
  return { id: 1, email: "admin@labfin.dev", full_name: "Admin Demo", empresa_id: 1, role_id: 1, is_active: true };
}
async function mockLogout(): Promise<void> { return; }

// --- Reales (cuando VITE_USE_MOCK_AUTH=false) ---
export async function login(payload: { email: string; password: string }) {
  if (USE_MOCK) return mockLogin(payload);
  return http<TokenPair>("/users/login", { method: "POST", body: JSON.stringify(payload) });
}

export async function signup(payload: { email: string; password: string; username: string }) {
  if (USE_MOCK) return mockSignup(payload);
  // Si decides registrar empresa + admin en un paso: /users/register-with-business
  return http<{ id: number }>("/users/register", { method: "POST", body: JSON.stringify(payload) });
}

export async function me() {
  if (USE_MOCK) return mockMe();
  return http<Me>("/users/me");
}

export async function logout() {
  if (USE_MOCK) return mockLogout();
  return http<void>("/users/logout", { method: "POST" });
}
