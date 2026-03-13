import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Loader2, Eye, Trash2, CheckSquare, Download } from 'lucide-react';
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
  PENDING: 'bg-yellow-100 text-yellow-900',
  STAGED: 'bg-zinc-100 text-zinc-900',
  CONFIRMED: 'bg-green-100 text-green-900',
  UPLOADED: 'bg-blue-100 text-blue-900',
  ACTIVE: 'bg-indigo-100 text-indigo-900',
  FAILED: 'bg-red-100 text-red-900',
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
  const [checkedIds, setCheckedIds] = useState<Record<number, boolean>>({});
  const [confirmProgress, setConfirmProgress] = useState<{ actual: number; total: number } | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [viewState, setViewState] = useState<{ file: FileEntry; url: string } | null>(null);
  const [viewLoading, setViewLoading] = useState<number | null>(null); // file id being fetched

  const selectedIds = Object.entries(checkedIds).filter(([, v]) => v).map(([k]) => Number(k));

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
      setCheckedIds({});
      onRefetch();
    } finally {
      setConfirmando(false);
      setConfirmProgress(null);
    }
  };

  const confirmSelected = () => runConfirm(selectedIds);
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

  // ---- View ----
  const handleView = async (f: FileEntry) => {
    setViewLoading(f.id);
    try {
      const { url } = await dataApi.getDownloadUrl(f.id);
      setViewState({ file: f, url });
    } catch {
      alert('El archivo aún no está disponible para visualizar.');
    } finally {
      setViewLoading(null);
    }
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  if (files.length === 0) return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;

  return (
    <div className="space-y-3">
      {/* Tabla */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Sel.</TableHead>
              <TableHead>Archivo</TableHead>
              <TableHead className="w-28">Estado</TableHead>
              <TableHead className="w-20">Activo</TableHead>
              <TableHead className="w-36">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((f) => {
              const isConfirmable = CONFIRMABLE.includes(f.status as FileStatus);
              return (
                <TableRow key={f.id}>
                  <TableCell>
                    <Checkbox
                      checked={!!checkedIds[f.id]}
                      disabled={!isConfirmable || confirmando}
                      onCheckedChange={(v) => setCheckedIds((p) => ({ ...p, [f.id]: !!v }))}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="block truncate max-w-xs text-sm" title={f.original_filename}>
                      {f.original_filename}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLE[f.status as FileStatus] ?? ''}>
                      {STATUS_LABEL[f.status as FileStatus] ?? f.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={!!f.is_active}
                      onCheckedChange={() => toggleActive(f)}
                      disabled={confirmando}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {/* Confirmar */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isConfirmable || confirmando}
                        title={isConfirmable ? 'Confirmar e indexar' : 'El archivo ya fue procesado'}
                        onClick={() => runConfirm([f.id])}
                      >
                        <CheckSquare className="h-4 w-4" />
                      </Button>
                      {/* Ver */}
                      <Button
                        variant="outline"
                        size="sm"
                        title="Ver archivo"
                        disabled={viewLoading === f.id}
                        onClick={() => handleView(f)}
                      >
                        {viewLoading === f.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Eye className="h-4 w-4" />}
                      </Button>
                      {/* Eliminar */}
                      <Button
                        variant="destructive"
                        size="sm"
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
      </div>

      {/* Barra de progreso */}
      {confirmando && confirmProgress && (
        <div className="px-4 py-3 border rounded-md bg-muted/40 flex items-center gap-3">
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
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={confirmSelected}
          disabled={selectedIds.length === 0 || confirmando}
        >
          {confirmando
            ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            : <CheckSquare className="h-4 w-4 mr-1.5" />}
          Confirmar seleccionados{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
        </Button>
        <Button size="sm" variant="secondary" onClick={confirmAll} disabled={confirmando}>
          {confirmando
            ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            : <CheckSquare className="h-4 w-4 mr-1.5" />}
          Confirmar todos
        </Button>
        <Button size="sm" variant="destructive" onClick={deleteAll} disabled={confirmando}>
          <Trash2 className="h-4 w-4 mr-1.5" />
          Borrar todos
        </Button>
      </div>

      {/* Modal de visualización */}
      {viewState && (
        <Dialog open onOpenChange={() => setViewState(null)}>
          <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-6 py-4 border-b shrink-0 flex-row items-center justify-between gap-4">
              <DialogTitle className="text-sm font-medium truncate">
                {viewState.file.original_filename}
              </DialogTitle>
              <a
                href={viewState.url}
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
                src={viewState.url}
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
