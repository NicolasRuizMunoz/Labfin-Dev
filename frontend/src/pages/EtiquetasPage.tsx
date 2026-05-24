import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tags, Plus, Trash2, Loader2, RefreshCw, Power, PowerOff, Search, Users, Mail, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  listEtiquetas,
  createEtiqueta,
  deleteEtiqueta,
  updateEtiqueta,
  runScrapeNow,
  descubrirLicitaciones,
  type EtiquetaBusqueda,
} from '@/services/etiquetas';
import { getMyOrg, updateMyOrg } from '@/services/organizations';

type FormState = {
  nombre: string;
  keywords: string;
  regiones: string;
  categorias: string;
  monto_min: string;
  monto_max: string;
};

const EMPTY_FORM: FormState = {
  nombre: '',
  keywords: '',
  regiones: '',
  categorias: '',
  monto_min: '',
  monto_max: '',
};

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const EtiquetasPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: etiquetas = [], isLoading } = useQuery({
    queryKey: ['etiquetas'],
    queryFn: listEtiquetas,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createEtiqueta({
        nombre: form.nombre.trim(),
        keywords: splitCsv(form.keywords),
        regiones: splitCsv(form.regiones),
        categorias: splitCsv(form.categorias),
        monto_min: parseAmount(form.monto_min),
        monto_max: parseAmount(form.monto_max),
        activa: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etiquetas'] });
      setForm(EMPTY_FORM);
      toast({ title: 'Etiqueta creada' });
    },
    onError: () => toast({ title: 'Error al crear etiqueta', variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteEtiqueta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etiquetas'] });
      toast({ title: 'Etiqueta eliminada' });
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) =>
      updateEtiqueta(id, { activa }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['etiquetas'] }),
  });

  const scrapeMut = useMutation({
    mutationFn: () => runScrapeNow(),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['licitaciones'] });
      const errores = r.errores.length ? ` · ${r.errores.length} errores` : '';
      toast({
        title: 'Sincronización de etiquetas completada',
        description: `Evaluadas: ${r.etiquetas_evaluadas} · Nuevas: ${r.licitaciones_nuevas} · Actualizadas: ${r.licitaciones_actualizadas} · Revisadas: ${r.licitaciones_revisadas}${errores}`,
      });
    },
    onError: (e: any) =>
      toast({
        title: 'Falló la sincronización',
        description: e?.message ?? 'Revisa la configuración MP_API_TICKET',
        variant: 'destructive',
      }),
  });

  const discoverMut = useMutation({
    mutationFn: () => descubrirLicitaciones(),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['licitaciones'] });
      const errores = r.errores.length ? ` · ${r.errores.length} errores` : '';
      toast({
        title: 'Descubrimiento completado',
        description: `Nuevas: ${r.licitaciones_nuevas} · Actualizadas: ${r.licitaciones_actualizadas} · Revisadas: ${r.licitaciones_revisadas} (próximos ${r.dias} días)${errores}`,
      });
    },
    onError: (e: any) =>
      toast({
        title: 'Falló el descubrimiento',
        description: e?.message ?? 'Revisa la configuración MP_API_TICKET',
        variant: 'destructive',
      }),
  });

  const canSubmit = form.nombre.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-page-header border-b border-border/30">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Tags className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Etiquetas de búsqueda</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Configura keywords, regiones y montos para traer licitaciones desde MercadoPúblico automáticamente.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => discoverMut.mutate()}
                disabled={discoverMut.isPending}
                className="gap-2"
                title="Trae todas las licitaciones publicadas (próximos días) para explorarlas"
              >
                {discoverMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                Descubrir licitaciones
              </Button>
              <Button
                onClick={() => scrapeMut.mutate()}
                disabled={scrapeMut.isPending || etiquetas.length === 0}
                variant="outline"
                className="gap-2"
                title="Sincroniza con detalle solo las que matchean tus etiquetas activas"
              >
                {scrapeMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Sincronizar etiquetas
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Formulario crear */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Nueva etiqueta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Obras civiles RM"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="keywords">Keywords (separadas por coma)</Label>
                <Input
                  id="keywords"
                  placeholder="construcción, obras, edificación"
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="regiones">Regiones</Label>
                <Input
                  id="regiones"
                  placeholder="Metropolitana, Valparaíso"
                  value={form.regiones}
                  onChange={(e) => setForm({ ...form, regiones: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="categorias">Categorías (rubro ONU)</Label>
                <Input
                  id="categorias"
                  placeholder="Servicios de construcción"
                  value={form.categorias}
                  onChange={(e) => setForm({ ...form, categorias: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="monto_min">Monto mínimo (CLP)</Label>
                <Input
                  id="monto_min"
                  type="text"
                  inputMode="numeric"
                  placeholder="1.000.000"
                  value={form.monto_min}
                  onChange={(e) => setForm({ ...form, monto_min: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="monto_max">Monto máximo (CLP)</Label>
                <Input
                  id="monto_max"
                  type="text"
                  inputMode="numeric"
                  placeholder="100.000.000"
                  value={form.monto_max}
                  onChange={(e) => setForm({ ...form, monto_max: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => createMut.mutate()}
                disabled={!canSubmit || createMut.isPending}
                className="gap-2"
              >
                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Crear etiqueta
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Listado */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            Cargando...
          </div>
        ) : etiquetas.length === 0 ? (
          <Card className="border-dashed border-2 border-border/60">
            <CardContent className="py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Search className="w-7 h-7 text-primary/60" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">Aún no tienes etiquetas</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Crea tu primera etiqueta arriba. Cuando esté activa, el scraper diario buscará licitaciones
                en MercadoPúblico que coincidan y las creará automáticamente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {etiquetas.map((e) => (
              <EtiquetaCard
                key={e.id}
                e={e}
                onDelete={() => deleteMut.mutate(e.id)}
                onToggle={() => toggleMut.mutate({ id: e.id, activa: !e.activa })}
              />
            ))}
          </div>
        )}

        {/* Equipo */}
        <TeamEmailsCard />
      </div>
    </div>
  );
};

function EtiquetaCard({
  e,
  onDelete,
  onToggle,
}: {
  e: EtiquetaBusqueda;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <Card className={`border ${e.activa ? 'border-primary/20' : 'border-border/40 opacity-70'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{e.nombre}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggle}
              title={e.activa ? 'Desactivar' : 'Activar'}
            >
              {e.activa ? (
                <Power className="w-4 h-4 text-emerald-600" />
              ) : (
                <PowerOff className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <ChipRow label="Keywords" items={e.keywords} />
        <ChipRow label="Regiones" items={e.regiones} />
        <ChipRow label="Categorías" items={e.categorias} />
        {(e.monto_min != null || e.monto_max != null) && (
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground">Monto:</span>{' '}
            {e.monto_min != null ? `≥ $${Number(e.monto_min).toLocaleString('es-CL')}` : 'sin mínimo'}
            {' · '}
            {e.monto_max != null ? `≤ $${Number(e.monto_max).toLocaleString('es-CL')}` : 'sin máximo'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamEmailsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: org, isLoading } = useQuery({ queryKey: ['my-org'], queryFn: getMyOrg });
  const [newEmail, setNewEmail] = useState('');

  const teamEmails = org?.team_emails ?? [];

  const saveMut = useMutation({
    mutationFn: (list: string[]) => updateMyOrg({ team_emails: list }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-org'] }),
    onError: () =>
      toast({
        title: 'No se pudo guardar el equipo',
        description: 'Revisa que el correo sea válido.',
        variant: 'destructive',
      }),
  });

  const handleAdd = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Correo inválido', variant: 'destructive' });
      return;
    }
    if (teamEmails.some((e) => e.toLowerCase() === email)) {
      toast({ title: 'Ese correo ya está en el equipo', variant: 'destructive' });
      return;
    }
    saveMut.mutate([...teamEmails, email], {
      onSuccess: () => {
        setNewEmail('');
        toast({ title: 'Correo agregado al equipo' });
      },
    });
  };

  const handleRemove = (email: string) => {
    saveMut.mutate(
      teamEmails.filter((e) => e !== email),
      { onSuccess: () => toast({ title: 'Correo eliminado' }) },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-secondary" />
          Equipo
          {teamEmails.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
              {teamEmails.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Correos del equipo que serán invitados automáticamente a cada evento de Google Calendar creado
          desde LabFin, para que la licitación aparezca en el calendario de todos.
        </p>

        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="comercial@famae.cl"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button
            onClick={handleAdd}
            disabled={saveMut.isPending || !newEmail.trim()}
            className="gap-2 shrink-0"
          >
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Agregar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando equipo...
          </div>
        ) : teamEmails.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            Aún no has agregado correos. Los que agregues aparecerán listados aquí.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {teamEmails.map((email) => (
              <li
                key={email}
                className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/30 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm text-foreground truncate">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{email}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemove(email)}
                  disabled={saveMut.isPending}
                  title="Eliminar del equipo"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex items-start gap-1.5 flex-wrap">
      <span className="text-muted-foreground font-medium shrink-0">{label}:</span>
      {items.map((it, i) => (
        <Badge key={`${it}-${i}`} variant="secondary" className="text-[10px] font-normal">
          {it}
        </Badge>
      ))}
    </div>
  );
}

export default EtiquetasPage;
