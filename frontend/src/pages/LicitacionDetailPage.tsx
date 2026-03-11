import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Upload as UploadIcon,
  CheckSquare,
  Download,
  Trash2,
  Loader2,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { getLicitacion, getLicitacionFiles } from '@/services/tenders';
import * as dataApi from '@/services/data';
import http from '@/lib/http';
import type { FileEntry, FileStatus } from '@/types/data';

const STATUS_LABEL: Record<FileStatus, string> = {
  PENDING: 'Pendiente',
  STAGED: 'En cola',
  CONFIRMED: 'Confirmado',
  UPLOADED: 'Subido',
  ACTIVE: 'Activo',
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

const LicitacionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const licitacionId = Number(id);
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Record<number, boolean>>({});

  const { data: licitacion } = useQuery({
    queryKey: ['licitacion', licitacionId],
    queryFn: () => getLicitacion(licitacionId),
  });

  const {
    data: files = [],
    isLoading: loadingFiles,
    refetch,
  } = useQuery({
    queryKey: ['licitacion-files', licitacionId],
    queryFn: () => getLicitacionFiles(licitacionId),
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (selectedFiles.length === 0) {
      setUploadError('Selecciona al menos un archivo.');
      return;
    }
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('licitacion_id', String(licitacionId));
        await http('/data/upload/', { method: 'POST', body: fd });
      }
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      refetch();
    } catch (err: any) {
      setUploadError(err?.message ?? 'Error al subir archivos');
    } finally {
      setUploading(false);
    }
  };

  const confirmSelected = async () => {
    const ids = Object.entries(checkedIds)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));
    if (!ids.length) return;
    await dataApi.confirmFilesBulk(ids);
    setCheckedIds({});
    refetch();
  };

  const confirmAll = async () => {
    const ids = files.map((f) => f.id);
    if (!ids.length) return;
    await dataApi.confirmFilesBulk(ids);
    refetch();
  };

  const toggleActive = async (f: FileEntry) => {
    await dataApi.setActive(f.id, !f.is_active);
    refetch();
  };

  const downloadFile = async (f: FileEntry) => {
    try {
      const { url } = await dataApi.getDownloadUrl(f.id);
      window.open(url, '_blank');
    } catch {
      alert('El archivo aún no está disponible para descarga.');
    }
  };

  const deleteOne = async (f: FileEntry) => {
    if (!confirm(`¿Eliminar "${f.original_filename}"?`)) return;
    await dataApi.deleteFile(f.id);
    refetch();
  };

  const selectedCount = Object.values(checkedIds).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tenders')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{licitacion?.nombre ?? '...'}</h1>
          {licitacion?.fecha_vencimiento && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Vence: {new Date(licitacion.fecha_vencimiento).toLocaleDateString('es-CL')}
            </p>
          )}
        </div>
      </div>

      {/* Subir archivos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Subir documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-3">
            <div className="space-y-1">
              <Label>Archivos</Label>
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  setSelectedFiles((prev) => {
                    const map = new Map(prev.map((f) => [`${f.name}::${f.size}`, f]));
                    for (const f of picked) map.set(`${f.name}::${f.size}`, f);
                    return Array.from(map.values());
                  });
                }}
              />
              {selectedFiles.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {selectedFiles.length}{' '}
                    {selectedFiles.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}
                  </p>
                  {selectedFiles.length > 1 && (
                    <ul className="text-xs space-y-0.5">
                      {selectedFiles.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="flex items-center justify-between">
                          <span className="truncate max-w-sm">{f.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-5 px-2 text-xs"
                            onClick={() => setSelectedFiles((p) => p.filter((_, pi) => pi !== i))}
                          >
                            Quitar
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={selectedFiles.length === 0 || uploading}>
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UploadIcon className="h-4 w-4 mr-2" />
                )}
                Subir
              </Button>
              {selectedFiles.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedFiles([]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Archivos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            Archivos{files.length > 0 ? ` (${files.length})` : ''}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
          </Button>
        </div>

        {loadingFiles ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay archivos aún. Sube los documentos de esta licitación.
          </p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Sel.</TableHead>
                    <TableHead className="w-14">ID</TableHead>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <Checkbox
                          checked={!!checkedIds[f.id]}
                          onCheckedChange={(v) =>
                            setCheckedIds((p) => ({ ...p, [f.id]: !!v }))
                          }
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{f.id}</TableCell>
                      <TableCell className="max-w-xs truncate">{f.original_filename}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_STYLE[f.status as FileStatus] ?? ''}>
                          {STATUS_LABEL[f.status as FileStatus] ?? f.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!f.is_active}
                          onCheckedChange={() => toggleActive(f)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => downloadFile(f)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteOne(f)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <div className="p-3 flex items-center gap-2 border-t">
              <Button size="sm" onClick={confirmSelected} disabled={selectedCount === 0}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Confirmar seleccionados{selectedCount > 0 ? ` (${selectedCount})` : ''}
              </Button>
              <Button size="sm" variant="secondary" onClick={confirmAll}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Confirmar todos
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LicitacionDetailPage;
