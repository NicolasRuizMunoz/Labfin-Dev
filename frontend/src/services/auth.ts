import http from '@/lib/http';

export type Me = {
  id: number; email: string; username?: string;
  organization_id?: number | null; role: string; is_active: boolean;
};

type TokenPair = { access_token: string; refresh_token: string; token_type: 'bearer' };

export const login  = (p: { email: string; password: string }) =>
  http<TokenPair>('/users/login', { method: 'POST', body: JSON.stringify(p) });

export const signup = (p: { org_name: string; org_rut: string; email: string; password: string; username: string }) =>
  http<{ id: number }>('/users/register', { method: 'POST', body: JSON.stringify(p) });

export const me     = () => http<Me>('/users/me');
export const logout = () => http<void>('/users/logout', { method: 'POST' });

export const requestPasswordReset = (p: { email: string }) =>
  http<void>('/users/password-reset/request', { method: 'POST', body: JSON.stringify(p) });

export const verifyResetCode = (p: { email: string; code: string }) =>
  http<{ token: string }>('/users/password-reset/verify', { method: 'POST', body: JSON.stringify(p) });

export const resetPassword = (p: { token: string; password: string }) =>
  http<void>('/users/password-reset/confirm', { method: 'POST', body: JSON.stringify(p) });
