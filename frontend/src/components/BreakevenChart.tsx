import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface ScenarioParams {
  costo_fijo: number;
  ingreso_mensual: number;
  costo_variable_mensual: number;
  descripcion: string;
}

interface CurvasData {
  meses_total: number;
  optimista: ScenarioParams;
  base: ScenarioParams;
  pesimista: ScenarioParams;
}

interface Props {
  curvas: CurvasData;
}

function ganancia(t: number, p: ScenarioParams): number {
  return (p.ingreso_mensual - p.costo_variable_mensual) * t - p.costo_fijo;
}

function fmtCLP(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toFixed(0);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-xs space-y-1">
      <p className="font-semibold mb-1">Mes {label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            ${Number(entry.value).toLocaleString('es-CL')}
          </span>
        </div>
      ))}
    </div>
  );
};

const BreakevenChart: React.FC<Props> = ({ curvas }) => {
  const { meses_total, optimista, base, pesimista } = curvas;

  const data = Array.from({ length: meses_total + 1 }, (_, t) => ({
    mes: t,
    Optimista: ganancia(t, optimista),
    Base: ganancia(t, base),
    Pesimista: ganancia(t, pesimista),
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="mes"
            label={{ value: 'Meses', position: 'insideBottomRight', offset: -4, fontSize: 11 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={fmtCLP}
            tick={{ fontSize: 11 }}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine
            y={0}
            stroke="#6b7280"
            strokeDasharray="4 4"
            label={{ value: 'Punto de Equilibrio', position: 'insideTopRight', fontSize: 10, fill: '#6b7280' }}
          />
          <Line type="monotone" dataKey="Optimista" stroke="#22c55e" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Base" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Pesimista" stroke="#f97316" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BreakevenChart;
