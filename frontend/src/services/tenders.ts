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
  fecha_vencimiento_preguntas: string | null;
  created_at: string;
  google_calendar_event_id: string | null;
  google_calendar_event_id_preguntas: string | null;
  files: LicitacionFile[];
  // MercadoPúblico-sourced fields (fuente === 'mercadopublico')
  codigo_externo?: string | null;
  link_externo?: string | null;
  organismo?: string | null;
  region?: string | null;
  monto_estimado?: number | string | null;
  moneda?: string | null;
  descripcion?: string | null;
  categoria?: string | null;
  estado_mp?: string | null;
  fuente?: 'manual' | 'mercadopublico';
}

export interface LicitacionCreate {
  nombre: string;
  fecha_vencimiento?: string | null;
  fecha_vencimiento_preguntas?: string | null;
}

export interface LicitacionUpdate {
  nombre?: string;
  fecha_vencimiento?: string | null;
  fecha_vencimiento_preguntas?: string | null;
}

export type ScoringCriterion = {
  puntuacion: number;
  peso: number;
  justificacion: string;
};

export type FactorExterno = {
  nombre: string;
  descripcion: string;
  impacto: 'positivo' | 'negativo' | 'incierto' | string;
  severidad: 'alta' | 'media' | 'baja' | string;
};

export type MercadoCompetencia = {
  margen_competencia_min?: number | null;
  margen_competencia_max?: number | null;
  margen_competencia_central?: number | null;
  comentario?: string | null;
};

export type AnalisisExtraData = {
  meta?: {
    version?: string;
    fecha_analisis?: string;
    licitacion_id?: string;
    organismo_comprador?: string;
    moneda?: string;
    cambios_desde_version_anterior?: string | null;
  };
  scoring?: {
    margen_estimado?: ScoringCriterion;
    fit_tecnico?: ScoringCriterion;
    capacidad_financiera?: ScoringCriterion;
    plazo_entrega?: ScoringCriterion;
    riesgo_boleta?: ScoringCriterion;
    probabilidad_adjudicacion?: ScoringCriterion;
    factor_externo?: ScoringCriterion;
    score_total?: number;
    recomendacion?: string;
  };
  breakeven?: {
    flujo_caja_inicial_requerido?: number | null;
  } & Record<string, unknown>;
  mercado?: MercadoCompetencia;
  factores_externos?: FactorExterno[];
  alertas?: string[];
};

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
    optimista: { costo_fijo: number; ingreso_mensual: number; costo_variable_mensual: number; descripcion: string; puntuacion?: number | null; recomendacion?: string | null };
    base: { costo_fijo: number; ingreso_mensual: number; costo_variable_mensual: number; descripcion: string; puntuacion?: number | null; recomendacion?: string | null };
    pesimista: { costo_fijo: number; ingreso_mensual: number; costo_variable_mensual: number; descripcion: string; puntuacion?: number | null; recomendacion?: string | null };
  } | null;
  extra_data: AnalisisExtraData | null;
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

export const syncCalendarEvent = (id: number, options?: { include_meet?: boolean }) =>
  http<{ event_id: string }>(`/data/licitacion/${id}/calendar/sync`, {
    method: 'POST',
    body: JSON.stringify({ include_meet: !!options?.include_meet }),
    headers: { 'Content-Type': 'application/json' },
  });

export const removeCalendarEvent = (id: number) =>
  http<void>(`/data/licitacion/${id}/calendar/sync`, { method: 'DELETE' });

export const syncCalendarEventPreguntas = (id: number, options?: { include_meet?: boolean }) =>
  http<{ event_id: string }>(`/data/licitacion/${id}/calendar/sync-preguntas`, {
    method: 'POST',
    body: JSON.stringify({ include_meet: !!options?.include_meet }),
    headers: { 'Content-Type': 'application/json' },
  });

export const removeCalendarEventPreguntas = (id: number) =>
  http<void>(`/data/licitacion/${id}/calendar/sync-preguntas`, { method: 'DELETE' });

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
