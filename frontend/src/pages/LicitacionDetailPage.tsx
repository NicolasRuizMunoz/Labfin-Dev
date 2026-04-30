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
  Target,
  Globe2,
  History,
  Wallet,
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
  type AnalisisExtraData,
  type ScoringCriterion,
  type FactorExterno,
} from '@/services/tenders';
import { listSimulaciones } from '@/services/simulaciones';
import * as dataApi from '@/services/data';
import http from '@/lib/http';

// ---- Helpers ----
const fmt = (n: number | null | undefined, prefix = '') =>
  n != null ? `${prefix}${n.toLocaleString('es-CL')}` : '—';


// ---- Parser de secciones del análisis ----
const SECTION_KEYS = [
  'VERSIÓN DEL ANÁLISIS',
  'RESUMEN',
  'FIT CON LA EMPRESA',
  'LOGÍSTICA Y ABASTECIMIENTO',
  'ANÁLISIS FINANCIERO',
  'GARANTÍAS',
  'FACTOR EXTERNO INESPERADO',
  'RIESGOS',
  'OPORTUNIDADES',
  'SCORING GO / NO-GO',
  'SCORE FINAL PONDERADO',
  'RECOMENDACIÓN',
  'PREGUNTAS PARA EL EQUIPO',
  'CAMBIOS RESPECTO AL ANÁLISIS ANTERIOR',
] as const;

type SectionKey = typeof SECTION_KEYS[number];

function parseSections(text: string): Partial<Record<SectionKey, string>> {
  const result: Partial<Record<SectionKey, string>> = {};
  const escaped = SECTION_KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')}):`, 'g');
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

// ---- Card sections config (para texto plano del análisis) ----
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

// ---- Helpers para extra_data estructurado ----
const SCORING_CRITERIA: { key: keyof NonNullable<AnalisisExtraData['scoring']>; label: string }[] = [
  { key: 'margen_estimado', label: 'Margen estimado' },
  { key: 'fit_tecnico', label: 'Fit técnico y experiencia' },
  { key: 'capacidad_financiera', label: 'Capacidad financiera y caja' },
  { key: 'plazo_entrega', label: 'Plazo de entrega vs. bases' },
  { key: 'riesgo_boleta', label: 'Riesgo boleta y penalizaciones' },
  { key: 'probabilidad_adjudicacion', label: 'Probabilidad de adjudicación' },
  { key: 'factor_externo', label: 'Factor externo' },
];

function recomendacionStyle(rec?: string, score?: number): { bg: string; text: string; border: string; label: string } {
  const upper = (rec || '').toUpperCase();
  if (upper.includes('CONFIANZA') || (score != null && score >= 4.0)) {
    return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-400/50', label: rec || 'Postular con confianza' };
  }
  if (upper.includes('NO POSTULAR') || (score != null && score < 2.0)) {
    return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', border: 'border-red-400/50', label: rec || 'No postular' };
  }
  if (upper.includes('CAUTELA') || (score != null && score < 3.0)) {
    return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-400/50', label: rec || 'Postular con cautela' };
  }
  return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-400/50', label: rec || 'Evaluar con el equipo' };
}

function alertaStyle(alerta: string): { bg: string; text: string; border: string } {
  const upper = alerta.toUpperCase();
  if (upper.includes('CRÍTICO') || upper.includes('CRITICO') || upper.includes('NO RECOMENDADO')) {
    return { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-800 dark:text-red-300', border: 'border-red-300 dark:border-red-800' };
  }
  if (upper.includes('ALTO') || upper.includes('ALERTA')) {
    return { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-800' };
  }
  return { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' };
}

function impactoStyle(impacto?: string): { bg: string; text: string } {
  const v = (impacto || '').toLowerCase();
  if (v === 'positivo') return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' };
  if (v === 'negativo') return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' };
  return { bg: 'bg-muted', text: 'text-muted-foreground' };
}

function severidadStyle(sev?: string): { bg: string; text: string } {
  const v = (sev || '').toLowerCase();
  if (v === 'alta') return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' };
  if (v === 'media') return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' };
  return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' };
}

// ---- Componentes de extra_data ----

function AlertasBanner({ alertas }: { alertas: string[] }) {
  if (!alertas?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {alertas.map((a, i) => {
        const s = alertaStyle(a);
        return (
          <div
            key={i}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium ${s.bg} ${s.text} ${s.border}`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {a}
          </div>
        );
      })}
    </div>
  );
}

function ScoringPanel({ scoring }: { scoring: NonNullable<AnalisisExtraData['scoring']> }) {
  const score = scoring.score_total;
  const recStyle = recomendacionStyle(scoring.recomendacion, score);
  return (
    <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-secondary/5 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">
            Scoring Go / No-Go
          </p>
        </div>
        {score != null && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Score total</p>
              <p className="text-2xl font-bold tabular-nums">{score.toFixed(2)}<span className="text-xs text-muted-foreground"> / 5</span></p>
            </div>
            <div className={`px-3 py-2 rounded-lg border ${recStyle.bg} ${recStyle.text} ${recStyle.border}`}>
              <p className="text-[10px] uppercase tracking-wide opacity-80">Recomendación</p>
              <p className="text-xs font-bold">{recStyle.label}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {SCORING_CRITERIA.map(({ key, label }) => {
          const c = scoring[key] as ScoringCriterion | undefined;
          if (!c) return null;
          const pct = ((c.puntuacion ?? 0) / 5) * 100;
          const barColor =
            (c.puntuacion ?? 0) >= 4 ? 'bg-emerald-500' :
            (c.puntuacion ?? 0) >= 3 ? 'bg-amber-500' :
            (c.puntuacion ?? 0) >= 2 ? 'bg-orange-500' : 'bg-red-500';
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="text-foreground font-medium">{label}</span>
                <span className="text-muted-foreground tabular-nums shrink-0">
                  <span className="font-bold text-foreground">{c.puntuacion ?? '—'}</span>/5
                  <span className="ml-1.5 opacity-60">· {((c.peso ?? 0) * 100).toFixed(0)}%</span>
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              {c.justificacion && (
                <p className="text-[11px] text-muted-foreground leading-snug pl-0.5">{c.justificacion}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FactoresExternosCard({ factores }: { factores: FactorExterno[] }) {
  if (!factores?.length) return null;
  return (
    <div className="rounded-xl border border-secondary/15 bg-secondary/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Globe2 className="w-4 h-4 text-secondary" />
        <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Factores externos</p>
      </div>
      <div className="space-y-3">
        {factores.map((f, i) => {
          const imp = impactoStyle(f.impacto);
          const sev = severidadStyle(f.severidad);
          return (
            <div key={i} className="rounded-lg border border-border/40 bg-card p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground">{f.nombre}</p>
                <div className="flex gap-1.5 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${imp.bg} ${imp.text}`}>
                    {f.impacto || 'incierto'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${sev.bg} ${sev.text}`}>
                    Sev. {f.severidad || 'baja'}
                  </span>
                </div>
              </div>
              {f.descripcion && (
                <p className="text-xs text-muted-foreground leading-relaxed">{f.descripcion}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VersionInfo({ meta, cambios }: { meta?: AnalisisExtraData['meta']; cambios?: string }) {
  const version = meta?.version;
  const desc = meta?.cambios_desde_version_anterior;
  if (!version && !cambios && !desc) return null;
  const isUpdate = version && version !== '1.0';
  return (
    <div className="flex items-start gap-2 text-xs">
      {version && (
        <Badge variant="outline" className={`shrink-0 ${isUpdate ? 'border-secondary/50 text-secondary' : 'border-primary/40 text-primary'}`}>
          <History className="w-3 h-3 mr-1" />
          v{version}
        </Badge>
      )}
      {(desc || cambios) && (
        <p className="text-muted-foreground leading-snug">{desc || cambios}</p>
      )}
    </div>
  );
}

function FlujoCajaInicial({ extra }: { extra: AnalisisExtraData }) {
  const flujo = extra.breakeven?.flujo_caja_inicial_requerido;
  if (flujo == null) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800">
      <Wallet className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
      <div className="text-xs">
        <span className="text-muted-foreground">Flujo de caja inicial requerido: </span>
        <span className="font-semibold text-amber-800 dark:text-amber-300">{fmt(Number(flujo), '$')}</span>
      </div>
    </div>
  );
}

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
  const extra = a.extra_data || undefined;
  const hasScoring = !!extra?.scoring && Object.keys(extra.scoring).length > 0;
  const hasFactores = !!extra?.factores_externos && extra.factores_externos.length > 0;
  const hasAlertas = !!extra?.alertas && extra.alertas.length > 0;
  const hasFlujo = extra?.breakeven?.flujo_caja_inicial_requerido != null;
  const cambios = sections['CAMBIOS RESPECTO AL ANÁLISIS ANTERIOR'];

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

          {/* 0a. Versión + descripción de cambios */}
          {(extra?.meta || cambios) && (
            <VersionInfo meta={extra?.meta} cambios={cambios} />
          )}

          {/* 0b. Alertas activas */}
          {hasAlertas && <AlertasBanner alertas={extra!.alertas!} />}

          {/* 0c. Flujo de caja inicial (destacado, no redundante con PE) */}
          {hasFlujo && <FlujoCajaInicial extra={extra!} />}

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

          {/* 3.5. Scoring estructurado + Factores externos */}
          {(hasScoring || hasFactores) && (
            <div className={`grid gap-4 ${hasScoring && hasFactores ? 'lg:grid-cols-[3fr_2fr]' : 'grid-cols-1'}`}>
              {hasScoring && <ScoringPanel scoring={extra!.scoring!} />}
              {hasFactores && <FactoresExternosCard factores={extra!.factores_externos!} />}
            </div>
          )}

          {/* 3.6. Fallbacks de texto si no llegó extra_data pero el texto sí trae las secciones */}
          {!hasScoring && sections['SCORING GO / NO-GO'] && (
            <Card className="bg-card border border-border/40 border-l-[3px] border-l-primary/40">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide text-primary/80">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  Scoring Go / No-Go
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {sections['SCORING GO / NO-GO']}
                  {sections['SCORE FINAL PONDERADO'] && `\n\n${sections['SCORE FINAL PONDERADO']}`}
                </p>
              </CardContent>
            </Card>
          )}
          {!hasFactores && sections['FACTOR EXTERNO INESPERADO'] && (
            <Card className="bg-card border border-border/40 border-l-[3px] border-l-secondary/40">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide text-secondary/80">
                  <Globe2 className="w-3.5 h-3.5 text-secondary" />
                  Factor externo inesperado
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{sections['FACTOR EXTERNO INESPERADO']}</p>
              </CardContent>
            </Card>
          )}

          {/* 4. Cards de secciones (texto) */}
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
