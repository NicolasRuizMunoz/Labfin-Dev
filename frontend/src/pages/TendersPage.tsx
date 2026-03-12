import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Trash2, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  listLicitaciones,
  createLicitacion,
  deleteLicitacion,
  type Licitacion,
} from '@/services/tenders';

const TendersPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  const { data: licitaciones = [], isLoading } = useQuery({
    queryKey: ['licitaciones'],
    queryFn: listLicitaciones,
  });

  const resetForm = () => {
    setNombre('');
    setFechaVencimiento('');
  };

  const createMut = useMutation({
    mutationFn: () =>
      createLicitacion({
        nombre,
        fecha_vencimiento: fechaVencimiento || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licitaciones'] });
      setOpen(false);
      resetForm();
      toast({ title: 'Licitación creada' });
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-10">

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-primary" />
              Licitaciones
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra y analiza los procesos de licitación de tu empresa.
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Licitación
          </Button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : licitaciones.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">No hay licitaciones aún</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Agrega tu primera licitación para comenzar el análisis. Puedes adjuntar los documentos
                directamente al crearla.
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Licitación
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {licitaciones.map((lic: Licitacion) => (
              <Card
                key={lic.id}
                className="bg-gradient-card border-0 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-shadow"
                onClick={() => navigate(`/tenders/${lic.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-start justify-between gap-2">
                    <span>{lic.nombre}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteMut.mutate(lic.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  {lic.fecha_vencimiento ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Vence: {new Date(lic.fecha_vencimiento).toLocaleDateString('es-CL')}
                    </span>
                  ) : (
                    <span>Sin fecha de vencimiento</span>
                  )}
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {lic.files?.length ?? 0}{' '}
                    {(lic.files?.length ?? 0) === 1 ? 'archivo' : 'archivos'}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo nueva licitación */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Licitación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Nombre del proceso"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha de vencimiento</Label>
              <Input
                id="fecha"
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              disabled={!nombre.trim() || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TendersPage;
