import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Trash2, Calendar, FileText, Loader2, Search, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  listLicitaciones,
  createLicitacion,
  deleteLicitacion,
  type Licitacion,
} from '@/services/tenders';

function fmtMonto(v: number | string | null | undefined): string {
  if (v == null) return '';
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return '';
  return `$${n.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
}

const TendersPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: licitaciones = [], isLoading } = useQuery({
    queryKey: ['licitaciones'],
    queryFn: listLicitaciones,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createLicitacion({
        nombre: 'Nueva licitación',
      }),
    onSuccess: (lic) => {
      queryClient.invalidateQueries({ queryKey: ['licitaciones'] });
      navigate(`/tenders/${lic.id}`);
    },
    onError: () => toast({ title: 'Error al crear licitación', variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteLicitacion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licitaciones'] });
      toast({ title: 'Licitación eliminada' });
    },
    onError: () => toast({ title: 'Error al eliminar', variant: 'destructive' }),
  });

  // ── Filtros (cliente) ───────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [estado, setEstado] = useState('');

  const regiones = useMemo(
    () => Array.from(new Set(licitaciones.map((l) => l.region).filter(Boolean))).sort() as string[],
    [licitaciones],
  );
  const estados = useMemo(
    () => Array.from(new Set(licitaciones.map((l) => l.estado_mp).filter(Boolean))).sort() as string[],
    [licitaciones],
  );

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return licitaciones.filter((l) => {
      if (region && l.region !== region) return false;
      if (estado && l.estado_mp !== estado) return false;
      if (q) {
        const hay = `${l.nombre} ${l.organismo ?? ''} ${l.codigo_externo ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [licitaciones, search, region, estado]);

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-gradient-page-header border-b border-border/30">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <ClipboardList className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Licitaciones</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Gestiona y analiza tus procesos de licitación</p>
              </div>
            </div>
            <Button onClick={() => createMut.mutate()} disabled={createMut.isPending} className="shadow-sm">
              {createMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Nueva Licitación
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">

        {/* Filtros */}
        {!isLoading && licitaciones.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, organismo o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {regiones.length > 0 && (
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Todas las regiones</option>
                {regiones.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            )}
            {estados.length > 0 && (
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Todos los estados</option>
                {estados.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {!isLoading && licitaciones.length > 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            Mostrando {filtradas.length} de {licitaciones.length} licitaciones
          </p>
        )}

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Cargando licitaciones...</span>
            </div>
          </div>
        ) : licitaciones.length === 0 ? (
          <Card className="border-dashed border-2 border-border/60">
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-primary/60" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">No hay licitaciones aún</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Agrega tu primera licitación para comenzar el análisis. Puedes adjuntar los documentos
                directamente al crearla.
              </p>
              <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
                {createMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Nueva Licitación
              </Button>
            </CardContent>
          </Card>
        ) : filtradas.length === 0 ? (
          <Card className="border-dashed border-2 border-border/60">
            <CardContent className="py-16 text-center text-muted-foreground">
              No hay licitaciones que coincidan con los filtros.
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtradas.map((lic: Licitacion) => (
              <Card
                key={lic.id}
                className="group bg-card border border-border/40 cursor-pointer hover:border-primary/30 hover:shadow-elevated transition-all duration-200"
                onClick={() => navigate(`/tenders/${lic.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-start justify-between gap-2">
                    <span className="group-hover:text-primary transition-colors">{lic.nombre}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        const n = lic.files?.length ?? 0;
                        if (
                          n > 0 &&
                          !window.confirm(
                            `"${lic.nombre}" tiene ${n} archivo${n === 1 ? '' : 's'} adjunto${n === 1 ? '' : 's'}. ` +
                              '¿Seguro que quieres eliminarla? Esta acción no se puede deshacer.'
                          )
                        ) {
                          return;
                        }
                        deleteMut.mutate(lic.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                  {lic.fuente === 'mercadopublico' && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge className="bg-secondary/10 text-secondary border border-secondary/30 text-[10px] font-normal hover:bg-secondary/10">
                        MercadoPúblico
                      </Badge>
                      {lic.codigo_externo && (
                        <span className="text-[10px] font-mono text-muted-foreground">{lic.codigo_externo}</span>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  {lic.fecha_vencimiento ? (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-secondary/70" />
                      Vence: {new Date(lic.fecha_vencimiento).toLocaleDateString('es-CL')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60">Sin fecha de vencimiento</span>
                  )}
                  {lic.organismo && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                      <span className="truncate">{lic.organismo}</span>
                    </span>
                  )}
                  {lic.region && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                      {lic.region}
                    </span>
                  )}
                  {lic.monto_estimado != null && (
                    <span className="font-medium text-foreground/80">
                      {fmtMonto(lic.monto_estimado)} {lic.moneda || ''}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary/70" />
                    {lic.files?.length ?? 0}{' '}
                    {(lic.files?.length ?? 0) === 1 ? 'archivo' : 'archivos'}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default TendersPage;
