import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getTokenUsageSummary,
  getAdminEscenarios,
  getAdminSimulaciones,
  deleteAdminEscenario,
  deleteAdminSimulacion,
  OrgUsageSummary,
} from '@/services/admin';
import { Coins, Zap, Activity, Filter, Building2, Loader2, DatabaseZap, FlaskConical, Layers, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (n: number) => n.toLocaleString('es-CL');
const fmtUsd = (n: number) => `$${n.toFixed(4)}`;

function costTier(cost: number): 'low' | 'mid' | 'high' {
  if (cost < 0.05) return 'low';
  if (cost < 0.50) return 'mid';
  return 'high';
}

const tierColors = {
  low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  mid: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const AdminPage = () => {
  const [data, setData] = useState<OrgUsageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [escenarios, setEscenarios] = useState<any[]>([]);
  const [simulaciones, setSimulaciones] = useState<any[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  const fetchData = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const params: { date_from?: string; date_to?: string } = {};
      if (from) params.date_from = from;
      if (to) params.date_to = to;
      setData(await getTokenUsageSummary(params));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    setLoadingAdmin(true);
    try {
      const [esc, sim] = await Promise.all([getAdminEscenarios(), getAdminSimulaciones()]);
      setEscenarios(esc);
      setSimulaciones(sim);
    } catch {
      setEscenarios([]);
      setSimulaciones([]);
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => { fetchData(); fetchAdminData(); }, []);

  const handleFilter = () => fetchData(dateFrom || undefined, dateTo || undefined);

  const totals = data.reduce(
    (acc, o) => ({
      tokens: acc.tokens + o.total_tokens,
      cost: acc.cost + o.total_cost_usd,
      requests: acc.requests + o.total_requests,
    }),
    { tokens: 0, cost: 0, requests: 0 },
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Panel de Administración
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consumo de tokens OpenAI por empresa
          </p>
        </div>

        {/* Date filters */}
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Desde</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40 h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40 h-9 text-sm"
                />
              </div>
              <Button size="sm" onClick={handleFilter} className="h-9">
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                Filtrar
              </Button>
              {(dateFrom || dateTo) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 text-xs"
                  onClick={() => { setDateFrom(''); setDateTo(''); fetchData(); }}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Total Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold tabular-nums">{loading ? '—' : fmt(totals.tokens)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" />
                Costo Total (USD)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold tabular-nums">{loading ? '—' : fmtUsd(totals.cost)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold tabular-nums">{loading ? '—' : fmt(totals.requests)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Data table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Consumo por Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Cargando datos...
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <DatabaseZap className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">Sin datos de consumo</p>
                <p className="text-xs mt-1">Los tokens se registran con cada llamada a OpenAI</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Empresa</TableHead>
                      <TableHead className="text-xs text-right">Análisis (tokens)</TableHead>
                      <TableHead className="text-xs text-right">Análisis (USD)</TableHead>
                      <TableHead className="text-xs text-right">Chat (tokens)</TableHead>
                      <TableHead className="text-xs text-right">Chat (USD)</TableHead>
                      <TableHead className="text-xs text-right">Simulaciones (tokens)</TableHead>
                      <TableHead className="text-xs text-right">Simulaciones (USD)</TableHead>
                      <TableHead className="text-xs text-right">Total Tokens</TableHead>
                      <TableHead className="text-xs text-right">Costo Total</TableHead>
                      <TableHead className="text-xs text-center">Requests</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((org) => {
                      const tier = costTier(org.total_cost_usd);
                      return (
                        <TableRow key={org.organization_id}>
                          <TableCell className="font-medium text-sm">
                            {org.organization_name}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {fmt(org.analysis.total_tokens)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                            {fmtUsd(org.analysis.cost_usd)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {fmt(org.chat.total_tokens)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                            {fmtUsd(org.chat.cost_usd)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {fmt(org.scenario_analysis.total_tokens)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                            {fmtUsd(org.scenario_analysis.cost_usd)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm font-semibold">
                            {fmt(org.total_tokens)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className={`text-xs tabular-nums ${tierColors[tier]}`}>
                              {fmtUsd(org.total_cost_usd)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center tabular-nums text-sm">
                            {fmt(org.total_requests)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Admin Escenarios & Simulaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Escenarios */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Escenarios (todas las orgs)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAdmin ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando...
                </div>
              ) : escenarios.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin escenarios</p>
              ) : (
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">ID</TableHead>
                        <TableHead className="text-xs">Nombre</TableHead>
                        <TableHead className="text-xs">Org</TableHead>
                        <TableHead className="text-xs text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {escenarios.map((esc: any) => (
                        <TableRow key={esc.id}>
                          <TableCell className="text-xs tabular-nums">{esc.id}</TableCell>
                          <TableCell className="text-sm">{esc.nombre}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{esc.organization_id}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={async () => {
                                if (!confirm('Eliminar escenario?')) return;
                                try {
                                  await deleteAdminEscenario(esc.id);
                                  toast.success('Escenario eliminado');
                                  fetchAdminData();
                                } catch (err: any) {
                                  toast.error(err?.message || 'Error al eliminar');
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Simulaciones */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Simulaciones (todas las orgs)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAdmin ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando...
                </div>
              ) : simulaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin simulaciones</p>
              ) : (
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">ID</TableHead>
                        <TableHead className="text-xs">Nombre</TableHead>
                        <TableHead className="text-xs">Licitacion</TableHead>
                        <TableHead className="text-xs text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simulaciones.map((sim: any) => (
                        <TableRow key={sim.id}>
                          <TableCell className="text-xs tabular-nums">{sim.id}</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-2">
                              {sim.color && (
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: sim.color }}
                                />
                              )}
                              {sim.nombre}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{sim.licitacion_id}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={async () => {
                                if (!confirm('Eliminar simulacion?')) return;
                                try {
                                  await deleteAdminSimulacion(sim.id);
                                  toast.success('Simulacion eliminada');
                                  fetchAdminData();
                                } catch (err: any) {
                                  toast.error(err?.message || 'Error al eliminar');
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
