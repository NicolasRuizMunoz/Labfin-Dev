// src/services/data.ts
import http from '@/lib/http';
import type { Batch, GroupedFiles } from '@/types/data';

export const listBatches = () =>
  http<Batch[]>('/data/upload/batch/list');

export const createBatch = (name: string) =>
  http<Batch>('/data/upload/batch/', {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: { 'Content-Type': 'application/json' },
  });

export const uploadFile = (form: FormData) =>
  http<{ message: string; file: any }>('/data/upload/', {
    method: 'POST',
    body: form, // NO seteamos Content-Type; lo pone el navegador
  });

export const listFiles = () =>
  http<GroupedFiles>('/data/file/list');

export const setActive = (fileId: number, is_active: boolean) =>
  http('/data/file/' + fileId + '/set-active', {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
    headers: { 'Content-Type': 'application/json' },
  });

export const getDownloadUrl = (fileId: number) =>
  http<{ url: string }>('/data/file/download-url/' + fileId);

export const deleteFile = (fileId: number) =>
  http('/data/file/' + fileId, { method: 'DELETE' });
