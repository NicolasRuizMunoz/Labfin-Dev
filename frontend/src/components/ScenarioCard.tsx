import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  DollarSign,
  Percent,
  Wallet,
  Info,
  Star,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface ScenarioParams {
  costo_fijo: number;
  ingreso_mensual: number;
  costo_variable_mensual: number;
  descripcion: string;
  puntuacion?: number | null;
  recomendacion?: string | null;
}

interface Props {
  nombre: string;
  color: string;
  scenario: ScenarioParams;
  mesesTotal: number;
  mesesPE?: number | null;
  ingresoTotalContrato?: number | null;
  flujoInicial?: number | null;
  esSimulacion?: boolean;
}

type RecLevel = 'verde' | 'amber' | 'rojo';

function fmtCLP(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

function fmtFull(value: number): string {
  return `$${value.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
}

function ganancia(t: number, p: ScenarioParams): number {
  return (p.ingreso_mensual - p.costo_variable_mensual) * t - p.costo_fijo;
}

function levelFromPuntuacion(puntuacion: number): RecLevel {
  if (puntuacion >= 4) return 'verde';
  if (puntuacion >= 3) return 'amber';
  return 'rojo';
}

function evaluarEscenario(
  margen: number,
  margenPct: number,
  mesesPE: number | null,
  mesesTotal: number,
): { level: RecLevel; label: string; razon: string } {
  if (margen <= 0) {
    return {
      level: 'rojo',
      label: 'No rentable',
      razon: 'El ingreso no supera el costo variable: cada mes acumula pérdida.',
    };
  }
  if (mesesPE != null && mesesPE > mesesTotal) {
    return {
      level: 'rojo',
      label: 'No alcanza PE',
      razon: `Necesitas ${mesesPE} meses para llegar al punto de equilibrio, pero el contrato dura ${mesesTotal}.`,
    };
  }
  if (mesesPE != null && mesesPE > mesesTotal * 0.75) {
    return {
      level: 'amber',
      label: 'Postular con cautela',
      razon: `El PE se alcanza tarde (mes ${mesesPE} de ${mesesTotal}). Margen real de ganancia es acotado.`,
    };
  }
  if (margenPct < 10) {
    return {
      level: 'amber',
      label: 'Margen ajustado',
      razon: `Margen de ${margenPct.toFixed(1)}% deja poco colchón ante imprevistos.`,
    };
  }
  return {
    level: 'verde',
    label: 'Postular con confianza',
    razon: `Margen de ${margenPct.toFixed(1)}% y PE en mes ${mesesPE ?? '—'} dejan ganancia neta estimada de ${fmtCLP(margen * (mesesTotal - (mesesPE ?? 0)))}.`,
  };
}

const REC_STYLES: Record<RecLevel, { bg: string; text: string; border: string; Icon: React.FC<{ className?: string }> }> = {
  verde: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-400/50',
    Icon: CheckCircle2,
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-400/50',
    Icon: AlertTriangle,
  },
  rojo: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-400/50',
    Icon: XCircle,
  },
};

const MiniTooltip = ({ active, payload, label, color }: any) => {
  if (!active || !payload?.length) return null;
  const v = Number(payload[0].value);
  return (
    <div className="rounded-md border bg-background px-2 py-1.5 shadow-md text-[11px] space-y-0.5">
      <p className="font-semibold">Mes {label}</p>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
        <span className={v >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
          {fmtFull(v)}
        </span>
      </div>
    </div>
  );
};

const ScenarioCard: React.FC<Props> = ({
  nombre,
  color,
  scenario,
  mesesTotal,
  mesesPE,
  ingresoTotalContrato,
  flujoInicial,
  esSimulacion = false,
}) => {
  const [open, setOpen] = useState(false);

  const margen = scenario.ingreso_mensual - scenario.costo_variable_mensual;
  const margenPct = scenario.ingreso_mensual > 0 ? (margen / scenario.ingreso_mensual) * 100 : 0;

  const computedPE = margen > 0 ? Math.ceil(scenario.costo_fijo / margen) : null;
  const peMeses = mesesPE ?? computedPE;

  const ingresoTotal = ingresoTotalContrato ?? scenario.ingreso_mensual * mesesTotal;
  const gananciaNeta = margen * mesesTotal - scenario.costo_fijo;

  const localRec = evaluarEscenario(margen, margenPct, peMeses, mesesTotal);
  // EVA's per-scenario score/recommendation takes precedence when available.
  const evaPuntuacion = typeof scenario.puntuacion === 'number' ? scenario.puntuacion : null;
  const evaRecomendacion = scenario.recomendacion?.trim() || null;
  const rec = {
    level: evaPuntuacion != null ? levelFromPuntuacion(evaPuntuacion) : localRec.level,
    label: evaRecomendacion || localRec.label,
    razon: localRec.razon,
  };
  const recStyle = REC_STYLES[rec.level];
  const RecIcon = recStyle.Icon;

  const data = Array.from({ length: mesesTotal + 1 }, (_, t) => ({
    mes: t,
    ganancia: ganancia(t, scenario),
  }));

  return (
    <Card
      className="border-2 overflow-hidden transition-shadow hover:shadow-card"
      style={{ borderColor: `${color}40` }}
    >
      <div
        className="px-4 py-3 cursor-pointer select-none border-b"
        style={{ backgroundColor: `${color}10`, borderBottomColor: `${color}30` }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-3 h-3 rounded-full inline-block shrink-0"
              style={{ backgroundColor: color }}
            />
            <h3 className="text-sm font-bold truncate" style={{ color }}>
              {nombre}
            </h3>
            {esSimulacion && (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                Sim
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {evaPuntuacion != null && (
              <div
                className={`flex items-center gap-1 px-1.5 py-1 rounded-md border text-[11px] font-bold tabular-nums ${recStyle.bg} ${recStyle.text} ${recStyle.border}`}
                title="Puntuación EVA del escenario"
              >
                <Star className="w-3 h-3 fill-current" />
                {evaPuntuacion}/5
              </div>
            )}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-bold ${recStyle.bg} ${recStyle.text} ${recStyle.border}`}
            >
              <RecIcon className="w-3 h-3" />
              {rec.label}
            </div>
            {open ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="h-64 sm:h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="2 3" className="stroke-muted" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={fmtCLP} tick={{ fontSize: 11 }} width={52} />
              <Tooltip content={<MiniTooltip color={color} />} />
              <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
              {peMeses != null && peMeses <= mesesTotal && (
                <ReferenceLine
                  x={peMeses}
                  stroke={color}
                  strokeDasharray="3 3"
                  label={{ value: 'PE', position: 'top', fontSize: 11, fill: color }}
                />
              )}
              <Line
                type="monotone"
                dataKey="ganancia"
                stroke={color}
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md bg-muted/40 px-2.5 py-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
              <Percent className="w-3 h-3" /> Margen
            </div>
            <div className="text-base font-bold tabular-nums leading-tight">
              {margenPct.toFixed(1)}%
            </div>
            <div className="text-[10px] text-muted-foreground tabular-nums">
              {fmtCLP(margen)}/mes
            </div>
          </div>
          <div className="rounded-md bg-muted/40 px-2.5 py-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
              <Calendar className="w-3 h-3" /> PE
            </div>
            <div className="text-base font-bold tabular-nums leading-tight">
              {peMeses != null ? `${peMeses} mes${peMeses === 1 ? '' : 'es'}` : '—'}
            </div>
            <div className="text-[10px] text-muted-foreground">
              de {mesesTotal} totales
            </div>
          </div>
          <div className="rounded-md bg-muted/40 px-2.5 py-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
              {gananciaNeta >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              Ganancia neta
            </div>
            <div
              className={`text-base font-bold tabular-nums leading-tight ${
                gananciaNeta >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
              }`}
            >
              {fmtCLP(gananciaNeta)}
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-border/40 space-y-3 bg-muted/10">
          {scenario.descripcion && (
            <div className="flex gap-2">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                  Supuestos del escenario
                </p>
                <p className="text-xs text-foreground leading-relaxed">{scenario.descripcion}</p>
              </div>
            </div>
          )}

          <div className={`rounded-md border p-2.5 ${recStyle.bg} ${recStyle.border}`}>
            <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-bold mb-1 ${recStyle.text}`}>
              <RecIcon className="w-3 h-3" /> {rec.label}
            </div>
            <p className={`text-xs leading-relaxed ${recStyle.text}`}>{rec.razon}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
              Desglose financiero
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-background border border-border/40 p-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <DollarSign className="w-2.5 h-2.5" /> Ingreso mensual
                </div>
                <div className="font-semibold tabular-nums">{fmtFull(scenario.ingreso_mensual)}</div>
              </div>
              <div className="rounded-md bg-background border border-border/40 p-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <DollarSign className="w-2.5 h-2.5" /> Costo variable / mes
                </div>
                <div className="font-semibold tabular-nums">{fmtFull(scenario.costo_variable_mensual)}</div>
              </div>
              <div className="rounded-md bg-background border border-border/40 p-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Wallet className="w-2.5 h-2.5" /> Costo fijo
                </div>
                <div className="font-semibold tabular-nums">{fmtFull(scenario.costo_fijo)}</div>
              </div>
              <div className="rounded-md bg-background border border-border/40 p-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <TrendingUp className="w-2.5 h-2.5" /> Margen $ / mes
                </div>
                <div className="font-semibold tabular-nums">{fmtFull(margen)}</div>
              </div>
              <div className="rounded-md bg-background border border-border/40 p-2 col-span-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <DollarSign className="w-2.5 h-2.5" /> Ingreso total estimado ({mesesTotal} meses)
                </div>
                <div className="font-semibold tabular-nums">{fmtFull(ingresoTotal)}</div>
              </div>
              {flujoInicial != null && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-2 col-span-2">
                  <div className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400">
                    <Wallet className="w-2.5 h-2.5" /> Flujo caja inicial requerido
                  </div>
                  <div className="font-semibold tabular-nums text-amber-800 dark:text-amber-300">
                    {fmtFull(Number(flujoInicial))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ScenarioCard;
