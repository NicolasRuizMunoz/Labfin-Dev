import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FlaskConical,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  listEscenarios,
  createEscenario,
  updateEscenario,
  deleteEscenario,
  type Escenario,
  type EscenarioCreate,
} from '@/services/escenarios';
import { listLicitaciones, type Licitacion } from '@/services/tenders';
import { listSimulaciones, type Simulacion } from '@/services/simulaciones';
import { Link } from 'react-router-dom';

// ---- Escenario Form Modal ----
interface EscenarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escenario?: Escenario;
}

const EscenarioModal: React.FC<EscenarioModalProps> = ({ open, onOpenChange, escenario }) => {
  const queryClient = useQueryClient();
  const isEdit = !!escenario;

  const [nombre, setNombre] = useState(escenario?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(escenario?.descripcion ?? '');
  const [tipo, setTipo] = useState(escenario?.tipo ?? '');

  const mutation = useMutation({
    mutationFn: () => {
      const data: EscenarioCreate = { nombre, descripcion };
      if (tipo.trim()) data.tipo = tipo.trim();
      return isEdit ? updateEscenario(escenario!.id, data) : createEscenario(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escenarios'] });
      toast.success(isEdit ? 'Escenario actualizado' : 'Escenario creado');
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Error al guardar escenario');
    },
  });

  const canSubmit = nombre.trim() && descripcion.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar' : 'Nuevo'} Escenario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Retraso 2 meses en entrega"
            />
          </div>
          <div>
            <Label>Descripcion</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe el escenario hipotetico en detalle..."
              rows={3}
            />
          </div>
          <div>
            <Label>Tipo (opcional)</Label>
            <Input
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ej: riesgo, oportunidad, costo"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---- Simulaciones Tab Content ----
const SimulacionesTab = () => {
  const { data: licitaciones = [], isLoading: loadingLic } = useQuery({
    queryKey: ['licitaciones'],
    queryFn: listLicitaciones,
  });

  const { data: simsByLic = {}, isLoading: loadingSims } = useQuery({
    queryKey: ['all-simulaciones'],
    queryFn: async () => {
      const lics = await listLicitaciones();
      const result: Record<number, { licitacion: Licitacion; simulaciones: Simulacion[] }> = {};
      for (const lic of lics) {
        try {
          const sims = await listSimulaciones(lic.id);
          if (sims.length > 0) {
            result[lic.id] = { licitacion: lic, simulaciones: sims };
          }
        } catch {
          // skip licitaciones with errors
        }
      }
      return result;
    },
    staleTime: 60_000,
  });

  const entries = Object.values(simsByLic);
  const loading = loadingLic || loadingSims;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Cargando simulaciones...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Layers className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No hay simulaciones</p>
        <p className="text-xs mt-1">
          Las simulaciones se crean desde la vista de cada licitacion.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map(({ licitacion, simulaciones }) => (
        <Card key={licitacion.id} className="border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{licitacion.nombre}</CardTitle>
              <Link to={`/tenders/${licitacion.id}`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  Ver licitacion
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {simulaciones.map((sim) => (
                <div
                  key={sim.id}
                  className="flex items-center gap-3 bg-muted/20 rounded-lg px-3 py-2"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: sim.color || '#6b7280' }}
                  />
                  <span className="text-sm font-medium flex-1">{sim.nombre}</span>
                  <div className="flex flex-wrap gap-1">
                    {sim.escenarios.map((esc) => (
                      <span
                        key={esc.id}
                        className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded"
                      >
                        {esc.nombre}
                      </span>
                    ))}
                  </div>
                  <span
                    className={`text-xs flex-shrink-0 ${sim.ultimo_analisis ? 'text-green-500' : 'text-yellow-500'}`}
                  >
                    {sim.ultimo_analisis ? 'Analizado' : 'Sin analizar'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ---- Main Page ----
const EscenariosPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEsc, setEditingEsc] = useState<Escenario | undefined>();

  const { data: escenarios = [], isLoading } = useQuery({
    queryKey: ['escenarios'],
    queryFn: listEscenarios,
  });

  const deleteMut = useMutation({
    mutationFn: deleteEscenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escenarios'] });
      toast.success('Escenario eliminado');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'No se puede eliminar: esta en uso por simulaciones');
    },
  });

  const filtered = search.trim()
    ? escenarios.filter(
        (e) =>
          e.nombre.toLowerCase().includes(search.toLowerCase()) ||
          e.descripcion.toLowerCase().includes(search.toLowerCase())
      )
    : escenarios;

  const openCreate = () => {
    setEditingEsc(undefined);
    setModalOpen(true);
  };

  const openEdit = (esc: Escenario) => {
    setEditingEsc(esc);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FlaskConical className="w-6 h-6" />
            Escenarios y Simulaciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea escenarios hipoteticos y combinalos en simulaciones para ver su impacto en el punto
            de equilibrio.
          </p>
        </div>

        <Tabs defaultValue="escenarios">
          <TabsList>
            <TabsTrigger value="escenarios">Escenarios</TabsTrigger>
            <TabsTrigger value="simulaciones">Simulaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="escenarios" className="space-y-4 mt-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar escenarios..."
                  className="pl-8"
                />
              </div>
              <Button onClick={openCreate} size="sm">
                <Plus className="w-4 h-4 mr-1" /> Nuevo escenario
              </Button>
            </div>

            {/* Table */}
            <Card className="border-border/50">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Cargando...
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <FlaskConical className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">
                      {search ? 'Sin resultados' : 'No hay escenarios'}
                    </p>
                    <p className="text-xs mt-1">
                      {search
                        ? 'Intenta con otro termino de busqueda'
                        : 'Crea tu primer escenario hipotetico'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs">Nombre</TableHead>
                          <TableHead className="text-xs">Descripcion</TableHead>
                          <TableHead className="text-xs text-center">Tipo</TableHead>
                          <TableHead className="text-xs text-center">Simulaciones</TableHead>
                          <TableHead className="text-xs text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((esc) => (
                          <TableRow key={esc.id}>
                            <TableCell className="font-medium text-sm">{esc.nombre}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                              {esc.descripcion}
                            </TableCell>
                            <TableCell className="text-center">
                              {esc.tipo ? (
                                <Badge variant="secondary" className="text-xs">
                                  {esc.tipo}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm tabular-nums">
                              {esc.simulaciones_count}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openEdit(esc)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    if (confirm('Eliminar este escenario?')) {
                                      deleteMut.mutate(esc.id);
                                    }
                                  }}
                                  disabled={esc.simulaciones_count > 0}
                                  title={
                                    esc.simulaciones_count > 0
                                      ? 'No se puede eliminar: esta en uso'
                                      : 'Eliminar'
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulaciones" className="mt-4">
            <SimulacionesTab />
          </TabsContent>
        </Tabs>
      </div>

      {modalOpen && (
        <EscenarioModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          escenario={editingEsc}
        />
      )}
    </div>
  );
};

export default EscenariosPage;
