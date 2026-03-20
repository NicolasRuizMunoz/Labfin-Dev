import http from '@/lib/http';

export interface Escenario {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string | null;
  parametros: Record<string, any> | null;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  simulaciones_count: number;
}

export interface EscenarioCreate {
  nombre: string;
  descripcion: string;
  tipo?: string;
  parametros?: Record<string, any>;
}

export interface EscenarioUpdate {
  nombre?: string;
  descripcion?: string;
  tipo?: string;
  parametros?: Record<string, any>;
}

export const listEscenarios = () =>
  http<Escenario[]>('/data/escenarios/');

export const getEscenario = (id: number) =>
  http<Escenario>(`/data/escenarios/${id}`);

export const createEscenario = (data: EscenarioCreate) =>
  http<Escenario>('/data/escenarios/', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

export const updateEscenario = (id: number, data: EscenarioUpdate) =>
  http<Escenario>(`/data/escenarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

export const deleteEscenario = (id: number) =>
  http<void>(`/data/escenarios/${id}`, { method: 'DELETE' });
