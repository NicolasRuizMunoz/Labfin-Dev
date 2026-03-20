import http from '@/lib/http';

export type UsageBucket = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  requests: number;
};

export type OrgUsageSummary = {
  organization_id: number;
  organization_name: string;
  analysis: UsageBucket;
  chat: UsageBucket;
  scenario_analysis: UsageBucket;
  total_tokens: number;
  total_cost_usd: number;
  total_requests: number;
};

export type TokenUsageDetail = {
  id: number;
  organization_id: number;
  user_id: number;
  usage_type: 'analysis' | 'chat' | 'scenario_analysis';
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  created_at: string;
};

export const getTokenUsageSummary = (params?: { date_from?: string; date_to?: string }) => {
  const qs = new URLSearchParams();
  if (params?.date_from) qs.set('date_from', params.date_from);
  if (params?.date_to) qs.set('date_to', params.date_to);
  const query = qs.toString();
  return http<OrgUsageSummary[]>(`/admin/token-usage/summary${query ? `?${query}` : ''}`);
};

export const getTokenUsageDetail = (params?: {
  organization_id?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.organization_id) qs.set('organization_id', String(params.organization_id));
  if (params?.date_from) qs.set('date_from', params.date_from);
  if (params?.date_to) qs.set('date_to', params.date_to);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return http<{ total: number; items: TokenUsageDetail[] }>(`/admin/token-usage/detail${query ? `?${query}` : ''}`);
};

export const getAdminEscenarios = () =>
  http<any[]>('/admin/escenarios');

export const getAdminSimulaciones = () =>
  http<any[]>('/admin/simulaciones');

export const deleteAdminEscenario = (id: number) =>
  http<void>(`/admin/escenarios/${id}`, { method: 'DELETE' });

export const deleteAdminSimulacion = (id: number) =>
  http<void>(`/admin/simulaciones/${id}`, { method: 'DELETE' });
