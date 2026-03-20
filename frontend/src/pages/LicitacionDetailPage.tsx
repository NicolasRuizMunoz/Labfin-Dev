import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Upload,
  FolderOpen,
  FlaskConical,
} from 'lucide-react';
import LicitacionChatPanel from '@/components/LicitacionChatPanel';
import SimulacionesPanel from '@/components/SimulacionesPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FileUploader from '@/components/FileUploader';
import FileTable from '@/components/FileTable';
import BreakevenChart, { type SimulacionLine } from '@/components/BreakevenChart';
import { Input } from '@/components/ui/input';
import {
  getLicitacion,
  getLicitacionFiles,
  getAnalisisHistory,
  analizarLicitacion,
  updateLicitacion,
  type AnalisisResult,
} from '@/services/tenders';
import { listSimulaciones } from '@/services/simulaciones';
import * as dataApi from '@/services/data';
import http from '@/lib/http';

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
const CARD_SECTIONS: { key: SectionKey; label: string; Icon: React.FC<{ className?: string }>; accent: 'green' | 'purple' | 'amber' }[] = [
  { key: 'RESUMEN', label: 'Resumen', Icon: FileText, accent: 'green' },
  { key: 'FIT CON LA EMPRESA', label: 'Fit con la Empresa', Icon: Building2, accent: 'purple' },
  { key: 'LOGÍSTICA Y ABASTECIMIENTO', label: 'Logística y Abastecimiento', Icon: Truck, accent: 'green' },
  { key: 'ANÁLISIS FINANCIERO', label: 'Análisis Financiero', Icon: TrendingUp, accent: 'green' },
  { key: 'GARANTÍAS', label: 'Garantías', Icon: ShieldCheck, accent: 'purple' },
  { key: 'RIESGOS', label: 'Riesgos', Icon: AlertTriangle, accent: 'amber' },
  { key: 'OPORTUNIDADES', label: 'Oportunidades', Icon: Star, accent: 'green' },
  { key: 'RECOMENDACIÓN', label: 'Recomendación', Icon: CheckCircle, accent: 'purple' },
];

const ACCENT_STYLES = {
  green: { card: 'border-l-primary/40', icon: 'text-primary', header: 'text-primary/80' },
  purple: { card: 'border-l-secondary/40', icon: 'text-secondary', header: 'text-secondary/80' },
  amber: { card: 'border-l-amber-500/40', icon: 'text-amber-600 dark:text-amber-400', header: 'text-amber-700/80 dark:text-amber-400/80' },
};

// ---- Panel de un análisis en el historial ----
function AnalisisPanel({
  a,
  isLatest,
  allFilesMap,
  activeSimLines = [],
}: {
  a: AnalisisResult;
  isLatest: boolean;
  allFilesMap: Record<number, string>;
  activeSimLines?: SimulacionLine[];
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

  // Calculate breakeven months for each active simulation
  const simTimelines = activeSimLines
    .map((sim) => {
      const margin = sim.curva_data.ingreso_mensual - sim.curva_data.costo_variable_mensual;
      const meses = margin > 0 ? Math.ceil(sim.curva_data.costo_fijo / margin) : null;
      return { nombre: sim.nombre, color: sim.color, meses };
    })
    .filter((s): s is { nombre: string; color: string; meses: number } => s.meses != null);

  const maxMeses = Math.max(
    a.breakeven_meses_optimista ?? 0,
    a.breakeven_meses_base ?? 0,
    a.breakeven_meses_pesimista ?? 0,
    ...simTimelines.map((s) => s.meses),
    1
  );

  return (
    <Card className={`border ${isLatest ? 'border-primary/30 shadow-card' : 'border-border/40'}`}>
      <CardHeader
        className="pb-2 cursor-pointer select-none hover:bg-muted/20 transition-colors rounded-t-lg"
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
                <div className="rounded-xl bg-primary/5 border border-primary/15 p-5 space-y-3">
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
                <div className="rounded-xl bg-secondary/5 border border-secondary/15 p-5 space-y-3">
                  <p className="text-xs font-semibold text-secondary flex items-center gap-1.5">
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
                    {/* Simulation breakeven bars */}
                    {simTimelines.map((sim) => (
                      <div key={sim.nombre} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                              style={{ backgroundColor: sim.color }}
                            />
                            {sim.nombre}
                          </span>
                          <span className="font-medium">{sim.meses} {sim.meses === 1 ? 'mes' : 'meses'}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: sim.color,
                              width: `${Math.min((sim.meses / maxMeses) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
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
                  <BreakevenChart curvas={a.curvas_data!} simulaciones={activeSimLines} />
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
            {CARD_SECTIONS.map(({ key, label, Icon, accent }) => {
              const content = sections[key];
              if (!content) return null;
              const styles = ACCENT_STYLES[accent];
              return (
                <Card key={key} className={`bg-card border border-border/40 border-l-[3px] ${styles.card}`}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className={`text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide ${styles.header}`}>
                      <Icon className={`w-3.5 h-3.5 ${styles.icon}`} />
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

  const queryClient = useQueryClient();
  const [analizando, setAnalizando] = useState(false);
  const [analisisError, setAnalisisError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftFecha, setDraftFecha] = useState('');
  const [filesOpen, setFilesOpen] = useState(false);

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

  const { data: simulaciones = [] } = useQuery({
    queryKey: ['simulaciones', licitacionId],
    queryFn: () => listSimulaciones(licitacionId),
  });

  const activeSimLines: SimulacionLine[] = React.useMemo(
    () =>
      simulaciones
        .filter((s) => s.is_active && s.ultimo_analisis?.curva_data)
        .map((s) => ({
          nombre: s.nombre,
          color: s.color || '#6b7280',
          curva_data: s.ultimo_analisis!.curva_data!,
        })),
    [simulaciones]
  );

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

  // ---- Inline edit name / date ----
  const saveName = async () => {
    if (!draftName.trim() || draftName === licitacion?.nombre) {
      setEditingName(false);
      return;
    }
    await updateLicitacion(licitacionId, { nombre: draftName.trim() });
    queryClient.invalidateQueries({ queryKey: ['licitacion', licitacionId] });
    setEditingName(false);
  };

  const saveFecha = async (value: string) => {
    setDraftFecha(value);
    await updateLicitacion(licitacionId, { fecha_vencimiento: value || null });
    queryClient.invalidateQueries({ queryKey: ['licitacion', licitacionId] });
  };

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
      queryClient.invalidateQueries({ queryKey: ['simulaciones', licitacionId] });
    } catch (err: any) {
      setAnalisisError(err?.message ?? 'Error al generar el análisis');
    } finally {
      setAnalizando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-gradient-page-header border-b border-border/30">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => navigate('/tenders')} className="h-9 w-9 shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="space-y-1">
                {editingName ? (
                  <Input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                    className="text-2xl font-bold h-auto py-0.5 px-1 -ml-1 border-primary/40"
                  />
                ) : (
                  <h1
                    className="text-2xl font-bold text-foreground cursor-pointer hover:text-primary/80 transition-colors"
                    onClick={() => { setDraftName(licitacion?.nombre ?? ''); setEditingName(true); }}
                    title="Haz click para editar el nombre"
                  >
                    {licitacion?.nombre ?? '...'}
                  </h1>
                )}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-secondary/70" />
                  <span>Vence:</span>
                  <Input
                    type="date"
                    value={draftFecha || licitacion?.fecha_vencimiento?.split('T')[0] || ''}
                    onChange={(e) => saveFecha(e.target.value)}
                    className="h-6 w-36 text-xs px-1 py-0 border-transparent hover:border-border focus:border-primary/40"
                  />
                </div>
              </div>
            </div>
            <Button onClick={handleAnalizar} disabled={analizando} className="gap-2 shadow-sm">
              {analizando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analizando ? 'Analizando...' : 'Analizar con EVA'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">

      {/* Documentos (collapsible) */}
      <Card className="border-border/40">
        <CardHeader
          className="pb-3 cursor-pointer select-none hover:bg-muted/20 transition-colors"
          onClick={() => setFilesOpen((v) => !v)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              Documentos
              {files.length > 0 && (
                <Badge variant="secondary" className="text-xs">{files.length}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {!filesOpen && (
                <span className="text-xs text-muted-foreground">
                  {files.length === 0 ? 'Sube archivos para analizar' : `${files.length} archivo${files.length !== 1 ? 's' : ''}`}
                </span>
              )}
              {filesOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        {filesOpen && (
          <CardContent className="space-y-4 pt-0">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Subir documentos
              </p>
              <FileUploader onUpload={handleUpload} label="Documentos de la licitación" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Archivos subidos</p>
                <Button variant="ghost" size="sm" onClick={() => refetchFiles()} className="h-6 text-xs gap-1">
                  <RefreshCw className="h-3 w-3" /> Actualizar
                </Button>
              </div>
              <FileTable
                files={files}
                loading={loadingFiles}
                onRefetch={() => refetchFiles()}
                emptyMessage="No hay archivos aún. Sube los documentos de esta licitación y confírmalos para que queden disponibles para el análisis de EVA."
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Simulaciones */}
      <SimulacionesPanel licitacionId={licitacionId} />

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
            <AnalisisPanel key={a.id} a={a} isLatest={i === 0} allFilesMap={allOrgFilesMap} activeSimLines={i === 0 ? activeSimLines : []} />
          ))
        )}
      </div>

      {/* Analisis de simulaciones */}
      {simulaciones.some(s => s.ultimo_analisis) && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-secondary" />
            Analisis de Simulaciones
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {simulaciones
              .filter(s => s.ultimo_analisis)
              .map(sim => (
                <Card key={sim.id} className="border border-border/40 border-l-[3px]" style={{ borderLeftColor: sim.color || '#6b7280' }}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide" style={{ color: sim.color || '#6b7280' }}>
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: sim.color || '#6b7280' }}
                      />
                      {sim.nombre}
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(sim.ultimo_analisis!.created_at).toLocaleString('es-CL')}
                      {sim.ultimo_analisis!.curva_data && (
                        <span className="ml-2">
                          CF: ${sim.ultimo_analisis!.curva_data.costo_fijo?.toLocaleString('es-CL') ?? '—'}
                          {' · '}Ing: ${sim.ultimo_analisis!.curva_data.ingreso_mensual?.toLocaleString('es-CL') ?? '—'}
                          {' · '}CV: ${sim.ultimo_analisis!.curva_data.costo_variable_mensual?.toLocaleString('es-CL') ?? '—'}
                        </span>
                      )}
                    </p>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {sim.ultimo_analisis!.analisis}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

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
    </div>
  );
};

export default LicitacionDetailPage;
