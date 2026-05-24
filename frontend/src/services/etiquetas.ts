import http from '@/lib/http';

export interface EtiquetaBusqueda {
  id: number;
  organization_id: number;
  nombre: string;
  keywords: string[];
  regiones: string[];
  categorias: string[];
  monto_min: number | null;
  monto_max: number | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface EtiquetaBusquedaCreate {
  nombre: string;
  keywords?: string[];
  regiones?: string[];
  categorias?: string[];
  monto_min?: number | null;
  monto_max?: number | null;
  activa?: boolean;
}

export interface EtiquetaBusquedaUpdate {
  nombre?: string;
  keywords?: string[];
  regiones?: string[];
  categorias?: string[];
  monto_min?: number | null;
  monto_max?: number | null;
  activa?: boolean;
}

export interface ScrapeRunResponse {
  etiquetas_evaluadas: number;
  licitaciones_revisadas: number;
  licitaciones_nuevas: number;
  licitaciones_actualizadas: number;
  errores: string[];
}

export const listEtiquetas = () =>
  http<EtiquetaBusqueda[]>('/data/etiquetas/');

export const createEtiqueta = (data: EtiquetaBusquedaCreate) =>
  http<EtiquetaBusqueda>('/data/etiquetas/', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

export const updateEtiqueta = (id: number, data: EtiquetaBusquedaUpdate) =>
  http<EtiquetaBusqueda>(`/data/etiquetas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

export const deleteEtiqueta = (id: number) =>
  http<void>(`/data/etiquetas/${id}`, { method: 'DELETE' });

export const runScrapeNow = () =>
  http<ScrapeRunResponse>('/data/etiquetas/scrape/run', { method: 'POST' });
