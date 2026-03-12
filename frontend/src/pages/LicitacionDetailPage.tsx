import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckSquare,
  Download,
  Trash2,
  Loader2,
  RefreshCw,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import FileUploader from '@/components/FileUploader';
import BreakevenChart from '@/components/BreakevenChart';
import {
  getLicitacion,
  getLicitacionFiles,
  getAnalisisHistory,
  analizarLicitacion,
  type AnalisisResult,
} from '@/services/tenders';
import * as dataApi from '@/services/data';
import http from '@/lib/http';
import type { FileEntry, FileStatus } from '@/types/data';

// ---- Constantes de estado ----
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

// ---- Helpers ----
const fmt = (n: number | null | undefined, prefix = '') =>
  n != null ? `${prefix}${n.toLocaleString('es-CL')}` : '—';

/** Precio estimado en USD según tokens totales y modelo. */
const PRICE_PER_M: Record<string, number> = {
  'gpt-4o-mini': 0.24,
  'gpt-4o': 4.0,
  'gpt-4.1-mini': 0.56,
  'gpt-4.1': 3.2,
};
function estimatePrice(model: string, tokens: number | null): string | null {
  if (!tokens) return null;
  const rate = PRICE_PER_M[model] ?? 1.0;
  const usd = (tokens / 1_000_000) * rate;
  return usd < 0.01 ? '<$0.01 USD' : `~$${usd.toFixed(3)} USD`;
}

// ---- Breakeven Card ----
function BreakevenCard({ a }: { a: AnalisisResult }) {
  const hasBk =
    a.breakeven_meses_base != null ||
    a.breakeven_costo_fijo != null ||
    a.breakeven_unidades != null;

  if (!hasBk) return null;

  const total = a.ingreso_total_contrato;
  const opt = a.breakeven_meses_optimista;
  const base = a.breakeven_meses_base;
  const pes = a.breakeven_meses_pesimista;
  const maxMeses = Math.max(opt ?? 0, base ?? 0, pes ?? 0, 1);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Punto de Equilibrio
          <span className="text-xs font-normal text-muted-foreground ml-1">
            PE = Costos Fijos / (Precio − Costo Variable)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ecuación con valores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Costos fijos</p>
            <p className="font-semibold">{fmt(a.breakeven_costo_fijo, '$')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Precio / período</p>
            <p className="font-semibold">{fmt(a.breakeven_precio_unitario, '$')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Costo variable / período</p>
            <p className="font-semibold">{fmt(a.breakeven_costo_variable_unitario, '$')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Períodos para PE</p>
            <p className="font-semibold">{fmt(a.breakeven_unidades)}</p>
          </div>
          {total != null && (
            <div className="col-span-2 sm:col-span-4">
              <p className="text-xs text-muted-foreground">Ingreso total estimado del contrato</p>
              <p className="font-semibold text-base">{fmt(total, '$')}</p>
            </div>
          )}
        </div>

        {/* Timeline de escenarios */}
        {(opt != null || base != null || pes != null) && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Tiempo hasta alcanzar PE</p>
            {[
              { label: 'Optimista', meses: opt, color: 'bg-green-500' },
              { label: 'Base', meses: base, color: 'bg-blue-500' },
              { label: 'Pesimista', meses: pes, color: 'bg-orange-500' },
            ].map(({ label, meses, color }) =>
              meses != null ? (
                <div key={label} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{meses} {meses === 1 ? 'mes' : 'meses'}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${Math.min((meses / maxMeses) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Curva de ganancia por escenario */}
        {a.curvas_data && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground font-medium mb-2">Curva de ganancia acumulada</p>
            <BreakevenChart curvas={a.curvas_data} />
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
              {(['optimista', 'base', 'pesimista'] as const).map((k) => (
                <div key={k} className="leading-snug">
                  <span className="capitalize font-medium text-foreground">{k}: </span>
                  {a.curvas_data![k].descripcion}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Panel de un análisis en el historial ----
function AnalisisPanel({ a, isLatest }: { a: AnalisisResult; isLatest: boolean }) {
  const [open, setOpen] = useState(isLatest);

  return (
    <Card className={isLatest ? 'border-primary/30' : ''}>
      <CardHeader
        className="pb-2 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            {isLatest && <Badge className="bg-primary/10 text-primary text-xs">Último</Badge>}
            <span className="text-muted-foreground">
              {new Date(a.created_at).toLocaleString('es-CL')}
            </span>
            {estimatePrice(a.model, a.tokens_usados) && (
              <>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground" title="Costo estimado de este análisis">
                  {estimatePrice(a.model, a.tokens_usados)}
                </span>
              </>
            )}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
          <span>{a.archivos_licitacion_ids?.length ?? a.chunks_licitacion} doc(s) licitación</span>
          <span>{a.archivos_empresa_ids?.length ?? a.chunks_empresa} doc(s) empresa</span>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 pt-0">
          <BreakevenCard a={a} />
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-sm leading-relaxed border-t pt-4">
            {a.analisis}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ---- Página principal ----
const LicitacionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const licitacionId = Number(id);
  const navigate = useNavigate();

  const [checkedIds, setCheckedIds] = useState<Record<number, boolean>>({});
  const [confirmando, setConfirmando] = useState(false);
  const [confirmProgress, setConfirmProgress] = useState<{ actual: number; total: number } | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [analisisError, setAnalisisError] = useState<string | null>(null);

  const { data: licitacion } = useQuery({
    queryKey: ['licitacion', licitacionId],
    queryFn: () => getLicitacion(licitacionId),
  });

  const { data: files = [], isLoading: loadingFiles, refetch: refetchFiles } = useQuery({
    queryKey: ['licitacion-files', licitacionId],
    queryFn: () => getLicitacionFiles(licitacionId),
  });

  const { data: historial = [], refetch: refetchHistorial } = useQuery({
    queryKey: ['licitacion-analisis', licitacionId],
    queryFn: () => getAnalisisHistory(licitacionId),
  });

  // ---- Upload via FileUploader ----
  const handleUpload = async (selectedFiles: File[]) => {
    for (const file of selectedFiles) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('licitacion_id', String(licitacionId));
      await http('/data/upload/', { method: 'POST', body: fd });
    }
    refetchFiles();
  };

  // ---- Confirmación ----
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
      refetchFiles();
    } finally {
      setConfirmando(false);
      setConfirmProgress(null);
    }
  };

  const confirmSelected = () =>
    runConfirm(Object.entries(checkedIds).filter(([, v]) => v).map(([k]) => Number(k)));

  const confirmAll = () => runConfirm(files.map((f) => f.id));

  // ---- Otras acciones ----
  const toggleActive = async (f: FileEntry) => { await dataApi.setActive(f.id, !f.is_active); refetchFiles(); };

  const downloadFile = async (f: FileEntry) => {
    try { const { url } = await dataApi.getDownloadUrl(f.id); window.open(url, '_blank'); }
    catch { alert('El archivo aún no está disponible para descarga.'); }
  };

  const deleteOne = async (f: FileEntry) => {
    if (!confirm(`¿Eliminar "${f.original_filename}"?`)) return;
    await dataApi.deleteFile(f.id);
    refetchFiles();
  };

  // ---- Análisis IA ----
  const handleAnalizar = async () => {
    setAnalizando(true);
    setAnalisisError(null);
    try {
      await analizarLicitacion(licitacionId);
      refetchHistorial();
    } catch (err: any) {
      setAnalisisError(err?.message ?? 'Error al generar el análisis');
    } finally {
      setAnalizando(false);
    }
  };

  const selectedCount = Object.values(checkedIds).filter(Boolean).length;

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
          {analizando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {analizando ? 'Analizando...' : 'Analizar con EVA'}
        </Button>
      </div>

      {/* Subir documentos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Subir documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader onUpload={handleUpload} label="Documentos de la licitación" />
        </CardContent>
      </Card>

      <Separator />

      {/* Archivos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            Archivos{files.length > 0 ? ` (${files.length})` : ''}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => refetchFiles()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
          </Button>
        </div>

        {loadingFiles ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay archivos aún. Sube los documentos de esta licitación y confírmalos para que queden disponibles para el análisis de EVA.
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
                          onCheckedChange={(v) => setCheckedIds((p) => ({ ...p, [f.id]: !!v }))}
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
                        <Switch checked={!!f.is_active} onCheckedChange={() => toggleActive(f)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => downloadFile(f)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteOne(f)}>
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
                    <span className="ml-1 text-xs font-medium text-foreground">
                      (puede tardar varios segundos por archivo)
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

      <Separator />

      {/* Historial de análisis EVA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Análisis EVA{historial.length > 0 ? ` (${historial.length})` : ''}
          </h2>
        </div>

        {analizando && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">EVA está estudiando tu licitación…</p>
              <p className="text-xs">Esto puede tomar entre 20 y 60 segundos.</p>
            </CardContent>
          </Card>
        )}

        {analisisError && !analizando && (
          <Card className="border-destructive/40">
            <CardContent className="py-6 text-sm text-destructive">{analisisError}</CardContent>
          </Card>
        )}

        {historial.length === 0 && !analizando ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay análisis. Confirma los archivos y presiona "Analizar con EVA".
          </p>
        ) : (
          historial.map((a, i) => (
            <AnalisisPanel key={a.id} a={a} isLatest={i === 0} />
          ))
        )}
      </div>
    </div>
  );
};

export default LicitacionDetailPage;
