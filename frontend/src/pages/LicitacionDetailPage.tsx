import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  FileText,
  Building2,
  Truck,
  ShieldCheck,
  AlertTriangle,
  Star,
  CheckCircle,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import LicitacionChatPanel from '@/components/LicitacionChatPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import FileUploader from '@/components/FileUploader';
import FileTable from '@/components/FileTable';
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
import type { FileEntry } from '@/types/data';

// ---- Helpers ----
const fmt = (n: number | null | undefined, prefix = '') =>
  n != null ? `${prefix}${n.toLocaleString('es-CL')}` : '—';


// ---- Parser de secciones del análisis ----
const SECTION_KEYS = [
  'RESUMEN',
  'FIT CON LA EMPRESA',
  'LOGÍSTICA Y ABASTECIMIENTO',
  'ANÁLISIS FINANCIERO',
  'GARANTÍAS',
  'RIESGOS',
  'OPORTUNIDADES',
  'RECOMENDACIÓN',
  'PREGUNTAS PARA EL EQUIPO',
] as const;

type SectionKey = typeof SECTION_KEYS[number];

function parseSections(text: string): Partial<Record<SectionKey, string>> {
  const result: Partial<Record<SectionKey, string>> = {};
  const pattern = new RegExp(
    `(${SECTION_KEYS.map((k) => k.replace(/[()]/g, '\\$&')).join('|')}):`,
    'g'
  );
  let lastKey: SectionKey | null = null;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (lastKey) result[lastKey] = text.slice(lastIndex, match.index).trim();
    lastKey = match[1] as SectionKey;
    lastIndex = match.index + match[0].length;
  }
  if (lastKey) result[lastKey] = text.slice(lastIndex).trim();
  return result;
}

// ---- Card sections config ----
const CARD_SECTIONS: { key: SectionKey; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: 'RESUMEN', label: 'Resumen', Icon: FileText },
  { key: 'FIT CON LA EMPRESA', label: 'Fit con la Empresa', Icon: Building2 },
  { key: 'LOGÍSTICA Y ABASTECIMIENTO', label: 'Logística y Abastecimiento', Icon: Truck },
  { key: 'ANÁLISIS FINANCIERO', label: 'Análisis Financiero', Icon: TrendingUp },
  { key: 'GARANTÍAS', label: 'Garantías', Icon: ShieldCheck },
  { key: 'RIESGOS', label: 'Riesgos', Icon: AlertTriangle },
  { key: 'OPORTUNIDADES', label: 'Oportunidades', Icon: Star },
  { key: 'RECOMENDACIÓN', label: 'Recomendación', Icon: CheckCircle },
];

// ---- Panel de un análisis en el historial ----
function AnalisisPanel({
  a,
  isLatest,
  allFilesMap,
}: {
  a: AnalisisResult;
  isLatest: boolean;
  allFilesMap: Record<number, string>;
}) {
  const [open, setOpen] = useState(isLatest);
  const sections = parseSections(a.analisis);
  const preguntas = sections['PREGUNTAS PARA EL EQUIPO'];

  // Tooltip de archivos usados
  const licNames = (a.archivos_licitacion_ids ?? [])
    .map((id) => allFilesMap[id] ?? `#${id}`)
    .join('\n');
  const empNames = (a.archivos_empresa_ids ?? [])
    .map((id) => allFilesMap[id] ?? `#${id}`)
    .join('\n');

  const hasEquacion =
    a.breakeven_costo_fijo != null ||
    a.breakeven_precio_unitario != null ||
    a.breakeven_unidades != null;
  const hasTimeline =
    a.breakeven_meses_optimista != null ||
    a.breakeven_meses_base != null ||
    a.breakeven_meses_pesimista != null;
  const hasChart = !!a.curvas_data;
  const maxMeses = Math.max(
    a.breakeven_meses_optimista ?? 0,
    a.breakeven_meses_base ?? 0,
    a.breakeven_meses_pesimista ?? 0,
    1
  );

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
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
          <span
            title={licNames || undefined}
            className={licNames ? 'cursor-help underline decoration-dotted' : ''}
          >
            {a.archivos_licitacion_ids?.length ?? a.chunks_licitacion} doc(s) licitación
          </span>
          <span
            title={empNames || undefined}
            className={empNames ? 'cursor-help underline decoration-dotted' : ''}
          >
            {a.archivos_empresa_ids?.length ?? a.chunks_empresa} doc(s) empresa
          </span>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-6 pt-2">

          {/* 1+2. Ecuación y Timeline en dos cards lado a lado */}
          {(hasEquacion || hasTimeline) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card izquierda: ecuación / números */}
              {hasEquacion && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-3">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Punto de Equilibrio
                  </p>
                  <p className="text-[11px] text-muted-foreground -mt-1">
                    PE = Costos Fijos / (Ingreso − Costo Variable)
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Costos fijos</p>
                      <p className="font-semibold">{fmt(a.breakeven_costo_fijo, '$')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ingreso / período</p>
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
                    {a.ingreso_total_contrato != null && (
                      <div className="col-span-2 border-t border-primary/10 pt-2">
                        <p className="text-xs text-muted-foreground">Ingreso total estimado</p>
                        <p className="font-semibold text-base">{fmt(a.ingreso_total_contrato, '$')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card derecha: timeline de escenarios */}
              {hasTimeline && (
                <div className="rounded-lg bg-muted/40 border border-border/50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Tiempo hasta alcanzar el PE
                  </p>
                  <div className="space-y-3">
                    {[
                      { label: 'Optimista', meses: a.breakeven_meses_optimista, color: 'bg-green-500' },
                      { label: 'Base', meses: a.breakeven_meses_base, color: 'bg-blue-500' },
                      { label: 'Pesimista', meses: a.breakeven_meses_pesimista, color: 'bg-orange-500' },
                    ].map(({ label, meses, color }) =>
                      meses != null ? (
                        <div key={label} className="space-y-1">
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
                </div>
              )}
            </div>
          )}

          {/* 3. Gráfico + Preguntas críticas */}
          {(hasChart || preguntas) && (
            <div className="grid gap-4" style={{ gridTemplateColumns: hasChart && preguntas ? '3fr 2fr' : '1fr' }}>
              {hasChart && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Curva de ganancia acumulada</p>
                  <BreakevenChart curvas={a.curvas_data!} />
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
              {preguntas && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex flex-col gap-3 dark:bg-amber-950/20 dark:border-amber-800/40">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    Preguntas críticas para el equipo
                  </p>
                  <ul className="space-y-2.5">
                    {preguntas
                      .split('\n')
                      .map((l) => l.replace(/^[-•]\s*/, '').trim())
                      .filter(Boolean)
                      .map((q, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-300">
                          <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-[10px] font-bold text-amber-800 dark:text-amber-300">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{q}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 4. Cards de secciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CARD_SECTIONS.map(({ key, label, Icon }) => {
              const content = sections[key];
              if (!content) return null;
              return (
                <Card key={key} className="bg-muted/30 border-border/50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                  </CardContent>
                </Card>
              );
            })}
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

  const [analizando, setAnalizando] = useState(false);
  const [analisisError, setAnalisisError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

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

  // Mapa id→nombre para todos los archivos de la organización (empresa + licitación)
  const { data: allOrgFilesGrouped = {} } = useQuery({
    queryKey: ['org-files'],
    queryFn: () => dataApi.listFiles(),
  });
  const allOrgFilesMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    for (const group of Object.values(allOrgFilesGrouped)) {
      for (const f of group as any[]) {
        map[f.id] = f.original_filename;
      }
    }
    return map;
  }, [allOrgFilesGrouped]);

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

  // ---- Análisis EVA ----
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
        <FileTable
          files={files}
          loading={loadingFiles}
          onRefetch={() => refetchFiles()}
          emptyMessage="No hay archivos aún. Sube los documentos de esta licitación y confírmalos para que queden disponibles para el análisis de EVA."
        />
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
            <AnalisisPanel key={a.id} a={a} isLatest={i === 0} allFilesMap={allOrgFilesMap} />
          ))
        )}
      </div>

      {/* ── Widget flotante de chat ──────────────────────────────────────── */}

      {/* Panel flotante (aparece sobre el botón) */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] h-[560px] rounded-2xl shadow-2xl border overflow-hidden">
          <LicitacionChatPanel
            licitacionId={licitacionId}
            licitacionNombre={licitacion?.nombre}
            onClose={() => setChatOpen(false)}
          />
        </div>
      )}

      {/* Botón circular flotante */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          chatOpen
            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
        aria-label={chatOpen ? 'Cerrar chat EVA' : 'Abrir chat EVA'}
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
};

export default LicitacionDetailPage;
