import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, X, Search } from 'lucide-react';
import { listEscenarios, type Escenario } from '@/services/escenarios';
import { createSimulacion, updateSimulacion, type Simulacion } from '@/services/simulaciones';
import { toast } from 'sonner';

const COLOR_PALETTE = ['#f97316', '#06b6d4', '#a855f7', '#ec4899', '#14b8a6', '#eab308'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licitacionId: number;
  simulacion?: Simulacion;
  onSuccess?: () => void;
}

const CrearSimulacionModal: React.FC<Props> = ({ open, onOpenChange, licitacionId, simulacion, onSuccess }) => {
  const queryClient = useQueryClient();
  const isEdit = !!simulacion;

  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  // Sync state when modal opens or simulacion changes
  useEffect(() => {
    if (open) {
      setNombre(simulacion?.nombre ?? '');
      setColor(simulacion?.color ?? COLOR_PALETTE[0]);
      setSelectedIds(new Set(simulacion?.escenarios.map(e => e.id) ?? []));
      setSearch('');
    }
  }, [open, simulacion]);

  const { data: escenarios = [] } = useQuery({
    queryKey: ['escenarios'],
    queryFn: listEscenarios,
    enabled: open,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return escenarios;
    const q = search.toLowerCase();
    return escenarios.filter(e => e.nombre.toLowerCase().includes(q) || e.descripcion.toLowerCase().includes(q));
  }, [escenarios, search]);

  const mutation = useMutation({
    mutationFn: () => {
      const data = { nombre, color, escenario_ids: Array.from(selectedIds) };
      return isEdit
        ? updateSimulacion(licitacionId, simulacion!.id, data)
        : createSimulacion(licitacionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulaciones', licitacionId] });
      toast.success(isEdit ? 'Simulacion actualizada' : 'Simulacion creada');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Error al guardar simulacion');
    },
  });

  const toggleEscenario = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 10) next.add(id);
      else toast.error('Maximo 10 escenarios por simulacion');
      return next;
    });
  };

  const canSubmit = nombre.trim() && selectedIds.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar' : 'Nueva'} Simulacion</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Retraso + costos altos" />
          </div>

          <div>
            <Label>Color de la linea</Label>
            <div className="flex gap-2 mt-1">
              {COLOR_PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? 'white' : 'transparent',
                    boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Escenarios ({selectedIds.size}/10)</Label>

            {selectedIds.size > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 mb-2">
                {Array.from(selectedIds).map(id => {
                  const esc = escenarios.find(e => e.id === id);
                  return esc ? (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {esc.nombre}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => toggleEscenario(id)} />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            <div className="relative mb-2">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar escenarios..."
                className="pl-8"
              />
            </div>

            <div className="border rounded-md max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 text-center">No hay escenarios disponibles</p>
              ) : (
                filtered.map(esc => (
                  <label
                    key={esc.id}
                    className="flex items-start gap-3 p-2 hover:bg-muted/20 cursor-pointer border-b last:border-b-0"
                  >
                    <Checkbox
                      checked={selectedIds.has(esc.id)}
                      onCheckedChange={() => toggleEscenario(esc.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{esc.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">{esc.descripcion}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CrearSimulacionModal;
