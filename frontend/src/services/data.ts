// src/services/data.ts
import http from '@/lib/http';
import type { Batch } from '@/types/data';

// -------- Batches --------

// GET /batch/list  -> devuelve FileBatchWithFilesResponse[]
export const listBatches = () =>
  http<Batch[]>('/data/batch/list');

// POST /batch/  -> { name?: string }
export const createBatch = (name?: string) =>
  http<Batch>('/data/batch/', {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: { 'Content-Type': 'application/json' },
  });

// -------- Upload --------

// POST /upload/  -> multipart: file, batch_id
export const uploadFile = (form: FormData) =>
  http<{ message: string; file: any }>('/data/upload/', {
    method: 'POST',
    body: form, // NO seteamos Content-Type; lo pone el navegador
  });

// -------- Files --------

// GET /file/list -> agrupado por estado (si aún lo usas en otras vistas)
export const listFiles = () =>
  http<Record<string, any[]>>('/data/file/list');

// PATCH /file/{id}/set-active
export const setActive = (fileId: number, is_active: boolean) =>
  http('/data/file/' + fileId + '/set-active', {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
    headers: { 'Content-Type': 'application/json' },
  });

// GET /file/download-url/{id}
export const getDownloadUrl = (fileId: number) =>
  http<{ url: string }>('/data/file/download-url/' + fileId);

// DELETE /file/{id}
export const deleteFile = (fileId: number) =>
  http('/data/file/' + fileId, { method: 'DELETE' });

// -------- Confirmación --------

// POST /file/confirm/bulk  -> { file_ids: number[] }
export const confirmFilesBulk = (fileIds: number[]) =>
  http<{ enqueued: number; errors: Array<{file_id: number; error: string}> }>(
    '/data/file/confirm/bulk',
    {
      method: 'POST',
      body: JSON.stringify({ file_ids: fileIds }),
      headers: { 'Content-Type': 'application/json' },
    }
  );

// (Opcional) confirmar 1
export const confirmOne = (fileId: number) =>
  http('/data/file/confirm/' + fileId, { method: 'POST' });
