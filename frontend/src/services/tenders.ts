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
