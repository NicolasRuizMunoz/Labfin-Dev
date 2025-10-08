import http from '@/lib/http';

export type Me = {
  id: number; email: string; username?: string;
  organization_id?: number | null; role_id: number; is_active: boolean;
};

type TokenPair = { access_token: string; refresh_token: string; token_type: 'bearer' };

export const login  = (p: { email: string; password: string }) =>
  http<TokenPair>('/users/login', { method: 'POST', body: JSON.stringify(p) });

// ⬇️ ahora requiere org_name y org_rut
export const signup = (p: { org_name: string; org_rut: string; email: string; password: string; username: string }) =>
  http<{ id: number }>('/users/register', { method: 'POST', body: JSON.stringify(p) });

export const me     = () => http<Me>('/users/me');
export const logout = () => http<void>('/users/logout', { method: 'POST' });
