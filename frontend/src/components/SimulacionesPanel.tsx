import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, ExternalLink, ChevronDown, ChevronUp, Pencil, Trash2, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listSimulaciones, toggleSimulacion, analizarSimulacion, deleteSimulacion, type Simulacion } from '@/services/simulaciones';
import CrearSimulacionModal from './CrearSimulacionModal';
import { toast } from 'sonner';

interface Props {
  licitacionId: number;
}

const SimulacionesPanel: React.FC<Props> = ({ licitacionId }) => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSim, setEditingSim] = useState<Simulacion | undefined>();
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const { data: simulaciones = [] } = useQuery({
    queryKey: ['simulaciones', licitacionId],
    queryFn: () => listSimulaciones(licitacionId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['simulaciones', licitacionId] });

  const toggleMut = useMutation({
    mutationFn: (simId: number) => toggleSimulacion(licitacionId, simId),
    onSuccess: invalidate,
  });

  const analyzeMut = useMutation({
    mutationFn: (simId: number) => {
      setAnalyzingId(simId);
      return analizarSimulacion(licitacionId, simId);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Simulacion analizada');
      setAnalyzingId(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Error al analizar simulacion');
      setAnalyzingId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (simId: number) => deleteSimulacion(licitacionId, simId),
    onSuccess: () => {
      invalidate();
      toast.success('Simulacion eliminada');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Error al eliminar');
    },
  });

  const openCreate = () => {
    setEditingSim(undefined);
    setModalOpen(true);
  };

  const openEdit = (sim: Simulacion) => {
    setEditingSim(sim);
    setModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader
          className="pb-3 cursor-pointer select-none hover:bg-muted/20 transition-colors"
          onClick={() => setPanelOpen((v) => !v)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Simulaciones</CardTitle>
              <Badge variant="secondary" className="text-xs">{simulaciones.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {panelOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); openCreate(); }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              )}
              {panelOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        {panelOpen && (
        <CardContent className="space-y-2 pt-0">
          {simulaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay simulaciones. Crea una para ver escenarios en el grafico.
            </p>
          ) : (
            simulaciones.map(sim => {
              const hasAnalisis = !!sim.ultimo_analisis;
              const isAnalyzing = analyzingId === sim.id;
              const isExpanded = expandedId === sim.id;

              return (
                <div key={sim.id} className="bg-muted/20 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <Switch
                      checked={sim.is_active}
                      onCheckedChange={() => toggleMut.mutate(sim.id)}
                      disabled={!hasAnalisis}
                      style={sim.is_active && sim.color ? { '--switch-accent': sim.color } as any : undefined}
                    />
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sim.color || '#6b7280' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sim.nombre}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sim.escenarios.map(esc => (
                          <span
                            key={esc.id}
                            className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded"
                          >
                            {esc.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(sim)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Eliminar esta simulacion?')) deleteMut.mutate(sim.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant={hasAnalisis ? 'outline' : 'default'}
                      size="sm"
                      className="text-xs flex-shrink-0"
                      onClick={() => analyzeMut.mutate(sim.id)}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : hasAnalisis ? 'Re-analizar' : 'Analizar'}
                    </Button>
                    {hasAnalisis && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : sim.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded analysis view */}
                  {isExpanded && hasAnalisis && (
                    <div className="px-3 pb-3 pt-1 border-t border-border/30">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        Analisis ({new Date(sim.ultimo_analisis!.created_at).toLocaleString('es-CL')})
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 max-h-48 overflow-y-auto">
                        {sim.ultimo_analisis!.analisis}
                      </p>
                      {sim.ultimo_analisis!.curva_data && (
                        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                          <span>Costo fijo: ${sim.ultimo_analisis!.curva_data.costo_fijo?.toLocaleString('es-CL') ?? '—'}</span>
                          <span>Ingreso: ${sim.ultimo_analisis!.curva_data.ingreso_mensual?.toLocaleString('es-CL') ?? '—'}</span>
                          <span>C. variable: ${sim.ultimo_analisis!.curva_data.costo_variable_mensual?.toLocaleString('es-CL') ?? '—'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div className="text-center pt-2">
            <Link to="/escenarios" className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
              Administrar escenarios y simulaciones <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </CardContent>
        )}
      </Card>

      <CrearSimulacionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        licitacionId={licitacionId}
        simulacion={editingSim}
      />
    </>
  );
};

export default SimulacionesPanel;
