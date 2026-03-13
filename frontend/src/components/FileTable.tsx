import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Eye, Trash2, CheckSquare, Download, FileText } from 'lucide-react';
import * as dataApi from '@/services/data';
import type { FileEntry, FileStatus } from '@/types/data';

const CONFIRMABLE: FileStatus[] = ['PENDING', 'STAGED', 'FAILED'];

const STATUS_LABEL: Record<FileStatus, string> = {
  PENDING: 'Pendiente',
  STAGED: 'En cola',
  CONFIRMED: 'Confirmado',
  UPLOADED: 'Subido',
  ACTIVE: 'Listo',
  FAILED: 'Fallido',
};

const STATUS_STYLE: Record<FileStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  STAGED: 'bg-slate-50 text-slate-600 border-slate-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPLOADED: 'bg-sky-50 text-sky-700 border-sky-200',
  ACTIVE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
};

interface FileTableProps {
  files: FileEntry[];
  loading?: boolean;
  onRefetch: () => void;
  emptyMessage?: string;
}

const FileTable: React.FC<FileTableProps> = ({
  files,
  loading,
  onRefetch,
  emptyMessage = 'No hay archivos aún.',
}) => {
  const [confirmProgress, setConfirmProgress] = useState<{ actual: number; total: number } | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [viewState, setViewState] = useState<{ file: FileEntry; previewUrl: string; downloadUrl: string } | null>(null);
  const [viewLoading, setViewLoading] = useState<number | null>(null);

  // ---- Confirm ----
  const runConfirm = async (ids: number[]) => {
    const pending = ids.filter((id) => {
      const f = files.find((f) => f.id === id);
      return f && CONFIRMABLE.includes(f.status as FileStatus);
    });
    if (!pending.length) return;
    setConfirmando(true);
    setConfirmProgress({ actual: 0, total: pending.length });
    try {
      for (let i = 0; i < pending.length; i++) {
        setConfirmProgress({ actual: i + 1, total: pending.length });
        await dataApi.confirmOne(pending[i]);
      }
      onRefetch();
    } finally {
      setConfirmando(false);
      setConfirmProgress(null);
    }
  };

  const confirmAll = () => runConfirm(files.map((f) => f.id));

  // ---- Active ----
  const toggleActive = async (f: FileEntry) => {
    await dataApi.setActive(f.id, !f.is_active);
    onRefetch();
  };

  // ---- Delete ----
  const deleteOne = async (f: FileEntry) => {
    if (!confirm(`¿Eliminar "${f.original_filename}"?`)) return;
    await dataApi.deleteFile(f.id);
    onRefetch();
  };

  const deleteAll = async () => {
    if (!confirm(`¿Eliminar TODOS los archivos (${files.length})? Esta acción no se puede deshacer.`)) return;
    for (const f of files) {
      try { await dataApi.deleteFile(f.id); } catch { /* continúa */ }
    }
    onRefetch();
  };

  // ---- View (preview inline + download URL) ----
  const handleView = async (f: FileEntry) => {
    setViewLoading(f.id);
    try {
      const [preview, download] = await Promise.all([
        dataApi.getPreviewUrl(f.id),
        dataApi.getDownloadUrl(f.id),
      ]);
      setViewState({ file: f, previewUrl: preview.url, downloadUrl: download.url });
    } catch {
      alert('El archivo aún no está disponible para visualizar.');
    } finally {
      setViewLoading(null);
    }
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  if (files.length === 0) {
    return (
      <div className="rounded-lg border bg-background shadow-sm p-8 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          {files.length} {files.length === 1 ? 'archivo' : 'archivos'}
        </p>
      </div>

      {/* Tabla */}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead>Archivo</TableHead>
            <TableHead className="w-28">Estado</TableHead>
            <TableHead className="w-20">Activo</TableHead>
            <TableHead className="w-36 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((f) => {
            const isConfirmable = CONFIRMABLE.includes(f.status as FileStatus);
            return (
              <TableRow key={f.id} className="hover:bg-muted/10 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span className="block truncate max-w-xs text-sm" title={f.original_filename}>
                      {f.original_filename}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs font-medium ${STATUS_STYLE[f.status as FileStatus] ?? ''}`}>
                    {STATUS_LABEL[f.status as FileStatus] ?? f.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={f.status !== 'ACTIVE' ? 'cursor-not-allowed' : undefined}
                    title={f.status !== 'ACTIVE' ? 'Debe confirmarse primero para poder activar' : undefined}
                  >
                    <Switch
                      checked={!!f.is_active}
                      onCheckedChange={() => toggleActive(f)}
                      disabled={confirmando || f.status !== 'ACTIVE'}
                    />
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {isConfirmable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        disabled={confirmando}
                        title="Confirmar e indexar"
                        onClick={() => runConfirm([f.id])}
                      >
                        <CheckSquare className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      title="Ver archivo"
                      disabled={viewLoading === f.id}
                      onClick={() => handleView(f)}
                    >
                      {viewLoading === f.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Eliminar archivo"
                      onClick={() => deleteOne(f)}
                      disabled={confirmando}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Barra de progreso */}
      {confirmando && confirmProgress && (
        <div className="px-5 py-3 border-t bg-primary/5 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <div className="flex-1 space-y-1">
            <p className="text-xs text-muted-foreground">
              Procesando {confirmProgress.actual} de {confirmProgress.total}…
              <span className="ml-1 font-medium text-foreground">(puede tardar varios segundos)</span>
            </p>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(confirmProgress.actual / confirmProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Acciones en bloque */}
      <div className="px-5 py-3 border-t bg-muted/20 flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="secondary" onClick={confirmAll} disabled={confirmando}>
          {confirmando
            ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            : <CheckSquare className="h-4 w-4 mr-1.5" />}
          Confirmar todos
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={deleteAll} disabled={confirmando}>
          <Trash2 className="h-4 w-4 mr-1.5" />
          Borrar todos
        </Button>
      </div>

      {/* Modal de visualización (preview inline) */}
      {viewState && (
        <Dialog open onOpenChange={() => setViewState(null)}>
          <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-6 py-4 border-b shrink-0 flex-row items-center justify-between gap-4">
              <DialogTitle className="text-sm font-medium truncate">
                {viewState.file.original_filename}
              </DialogTitle>
              <a
                href={viewState.downloadUrl}
                download={viewState.file.original_filename}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1.5" />
                  Descargar
                </Button>
              </a>
            </DialogHeader>
            <div className="flex-1 overflow-hidden bg-muted/20">
              <iframe
                src={viewState.previewUrl}
                title={viewState.file.original_filename}
                className="w-full h-full border-0"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FileTable;
