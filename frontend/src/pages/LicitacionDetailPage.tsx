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
  Sparkles,
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
import { getLicitacion, getLicitacionFiles, analizarLicitacion, type AnalisisResult } from '@/services/tenders';
import * as dataApi from '@/services/data';
import http from '@/lib/http';
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

const LicitacionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const licitacionId = Number(id);
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Record<number, boolean>>({});

  const [confirmando, setConfirmando] = useState(false);
  const [confirmProgress, setConfirmProgress] = useState<{ actual: number; total: number } | null>(null);

  const [analisis, setAnalisis] = useState<AnalisisResult | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [analisisError, setAnalisisError] = useState<string | null>(null);

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

  const runConfirm = async (ids: number[]) => {
    // Solo archivos que aún no han sido procesados
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
      refetch();
    } finally {
      setConfirmando(false);
      setConfirmProgress(null);
    }
  };

  const confirmSelected = () => {
    const ids = Object.entries(checkedIds)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));
    return runConfirm(ids);
  };

  const confirmAll = () => runConfirm(files.map((f) => f.id));

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

  const handleAnalizar = async () => {
    setAnalizando(true);
    setAnalisisError(null);
    setAnalisis(null);
    try {
      const result = await analizarLicitacion(licitacionId);
      setAnalisis(result);
    } catch (err: any) {
      setAnalisisError(err?.message ?? 'Error al generar el análisis');
    } finally {
      setAnalizando(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3">
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
        <Button onClick={handleAnalizar} disabled={analizando} className="gap-2">
          {analizando
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Sparkles className="w-4 h-4" />}
          {analizando ? 'Analizando...' : 'Analizar con IA'}
        </Button>
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
                          disabled={!CONFIRMABLE.includes(f.status as FileStatus)}
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
            {confirmando && confirmProgress && (
              <div className="px-4 py-3 border-t bg-muted/40 flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Procesando archivo {confirmProgress.actual} de {confirmProgress.total}…
                    <span className="ml-1 text-xs text-foreground font-medium">
                      (esto puede tardar varios segundos por archivo)
                    </span>
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
            <div className="p-3 flex items-center gap-2 border-t">
              <Button size="sm" onClick={confirmSelected} disabled={selectedCount === 0 || confirmando}>
                {confirmando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
                Confirmar seleccionados{selectedCount > 0 ? ` (${selectedCount})` : ''}
              </Button>
              <Button size="sm" variant="secondary" onClick={confirmAll} disabled={confirmando}>
                {confirmando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
                Confirmar todos
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Panel de análisis IA */}
      {(analisis || analizando || analisisError) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Análisis IA
            </h2>

            {analizando && (
              <Card>
                <CardContent className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm">Analizando documentos con IA...</p>
                  <p className="text-xs">Esto puede tomar entre 20 y 60 segundos.</p>
                </CardContent>
              </Card>
            )}

            {analisisError && !analizando && (
              <Card className="border-destructive/40">
                <CardContent className="py-6 text-sm text-destructive">
                  {analisisError}
                </CardContent>
              </Card>
            )}

            {analisis && !analizando && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Modelo: {analisis.model}</span>
                    <span className="flex gap-4">
                      <span>Docs licitación: {analisis.chunks_licitacion} archivos</span>
                      <span>Docs empresa: {analisis.chunks_empresa} archivos</span>
                      {analisis.tokens_usados && <span>Tokens: {analisis.tokens_usados.toLocaleString()}</span>}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-sm leading-relaxed">
                    {analisis.analisis}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LicitacionDetailPage;
