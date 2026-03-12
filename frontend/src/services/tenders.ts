import http from '@/lib/http';

export interface LicitacionFile {
  id: number;
  original_filename: string;
  status: string;
}

export interface Licitacion {
  id: number;
  organization_id: number;
  nombre: string;
  fecha_vencimiento: string | null;
  created_at: string;
  files: LicitacionFile[];
}

export interface LicitacionCreate {
  nombre: string;
  fecha_vencimiento?: string | null;
}

export interface LicitacionUpdate {
  nombre?: string;
  fecha_vencimiento?: string | null;
}

export interface AnalisisResult {
  id: number;
  analisis: string;
  model: string;
  tokens_usados: number | null;
  chunks_licitacion: number;
  chunks_empresa: number;
  archivos_licitacion_ids: number[] | null;
  archivos_empresa_ids: number[] | null;
  breakeven_costo_fijo: number | null;
  breakeven_precio_unitario: number | null;
  breakeven_costo_variable_unitario: number | null;
  breakeven_unidades: number | null;
  breakeven_meses_optimista: number | null;
  breakeven_meses_base: number | null;
  breakeven_meses_pesimista: number | null;
  ingreso_total_contrato: number | null;
  curvas_data: {
    meses_total: number;
    optimista: { costo_fijo: number; ingreso_mensual: number; costo_variable_mensual: number; descripcion: string };
    base: { costo_fijo: number; ingreso_mensual: number; costo_variable_mensual: number; descripcion: string };
    pesimista: { costo_fijo: number; ingreso_mensual: number; costo_variable_mensual: number; descripcion: string };
  } | null;
  created_at: string;
}

export const listLicitaciones = () =>
  http<Licitacion[]>('/data/licitacion/');

export const createLicitacion = (data: LicitacionCreate) =>
  http<Licitacion>('/data/licitacion/', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

export const getLicitacion = (id: number) =>
  http<Licitacion>(`/data/licitacion/${id}`);

export const updateLicitacion = (id: number, data: LicitacionUpdate) =>
  http<Licitacion>(`/data/licitacion/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

export const deleteLicitacion = (id: number) =>
  http<void>(`/data/licitacion/${id}`, { method: 'DELETE' });

export const getLicitacionFiles = (id: number) =>
  http<import('@/types/data').FileEntry[]>(`/data/licitacion/${id}/files`);

export const getAnalisisHistory = (id: number) =>
  http<AnalisisResult[]>(`/data/licitacion/${id}/analisis`);

export const analizarLicitacion = (id: number) =>
  http<AnalisisResult>(`/data/licitacion/${id}/analizar`, { method: 'POST' });

export const uploadFilesToLicitacion = async (licitacionId: number, files: File[]) => {
  for (const file of files) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('licitacion_id', String(licitacionId));
    await http<{ message: string; file: LicitacionFile }>('/data/upload/', {
      method: 'POST',
      body: fd,
    });
  }
};
