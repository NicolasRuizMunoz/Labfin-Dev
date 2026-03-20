import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Trash2, Calendar, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {licitaciones.map((lic: Licitacion) => (
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
                      onClick={(e) => { e.stopPropagation(); deleteMut.mutate(lic.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardTitle>
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
