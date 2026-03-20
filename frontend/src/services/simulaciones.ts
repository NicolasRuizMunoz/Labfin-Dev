import http from '@/lib/http';
import type { Escenario } from './escenarios';

export interface AnalisisSimulacionResult {
  id: number;
  analisis: string;
  model: string;
  tokens_usados: number | null;
  curva_data: {
    costo_fijo: number;
    ingreso_mensual: number;
    costo_variable_mensual: number;
    descripcion: string;
  } | null;
  created_at: string;
}

export interface Simulacion {
  id: number;
  nombre: string;
  color: string | null;
  is_active: boolean;
  escenarios: Escenario[];
  ultimo_analisis: AnalisisSimulacionResult | null;
  created_at: string;
}

export interface SimulacionCreate {
  nombre: string;
  color?: string;
  escenario_ids: number[];
}

export interface SimulacionUpdate {
  nombre?: string;
  color?: string;
  escenario_ids?: number[];
  is_active?: boolean;
}

export const listSimulaciones = (licId: number) =>
  http<Simulacion[]>(`/data/licitacion/${licId}/simulaciones`);

export const createSimulacion = (licId: number, data: SimulacionCreate) =>
  http<Simulacion>(`/data/licitacion/${licId}/simulaciones`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

export const updateSimulacion = (licId: number, simId: number, data: SimulacionUpdate) =>
  http<Simulacion>(`/data/licitacion/${licId}/simulaciones/${simId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

export const deleteSimulacion = (licId: number, simId: number) =>
  http<void>(`/data/licitacion/${licId}/simulaciones/${simId}`, { method: 'DELETE' });

export const toggleSimulacion = (licId: number, simId: number) =>
  http<Simulacion>(`/data/licitacion/${licId}/simulaciones/${simId}/toggle`, { method: 'PATCH' });

export const analizarSimulacion = (licId: number, simId: number) =>
  http<AnalisisSimulacionResult>(`/data/licitacion/${licId}/simulaciones/${simId}/analizar`, { method: 'POST' });

export const getAnalisisSimulacionHistory = (licId: number, simId: number) =>
  http<AnalisisSimulacionResult[]>(`/data/licitacion/${licId}/simulaciones/${simId}/analisis`);
