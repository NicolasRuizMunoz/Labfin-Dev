import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Loader2,
  Trash2,
  Download,
  RefreshCw,
  CheckSquare,
  ChevronsUpDown,
  Check,
} from "lucide-react";

import * as dataApi from "@/services/data";
import type { Batch, FileEntry, FileStatus } from "@/types/data";
import { cn } from "@/lib/utils";
import FileUploader from "@/components/FileUploader";

const CONFIRMABLE: FileStatus[] = ['PENDING', 'STAGED', 'FAILED'];

const STATUS_LABEL: Record<FileStatus, string> = {
  PENDING: "Pendiente",
  STAGED: "En cola",
  CONFIRMED: "Confirmado",
  UPLOADED: "Subido",
  ACTIVE: "Listo",
  FAILED: "Fallido",
};

const STATUS_STYLE: Record<FileStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-900",
  STAGED: "bg-zinc-100 text-zinc-900",
  CONFIRMED: "bg-green-100 text-green-900",
  UPLOADED: "bg-blue-100 text-blue-900",
  ACTIVE: "bg-indigo-100 text-indigo-900",
  FAILED: "bg-red-100 text-red-900",
};

function StatusBadge({ s }: { s: FileStatus }) {
  return <Badge className={STATUS_STYLE[s]}>{STATUS_LABEL[s] ?? s}</Badge>;
}

type BatchWithFiles = Batch & { files: FileEntry[] };
type BatchChoice =
  | { mode: "existing"; id: number; label: string }
  | { mode: "new"; name: string };

const FilesManagerPage: React.FC = () => {
  const [batches, setBatches] = useState<BatchWithFiles[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Combobox de batch
  const [batchOpen, setBatchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [choice, setChoice] = useState<BatchChoice | null>(null);

  const [checkedByFileId, setCheckedByFileId] = useState<Record<number, boolean>>({});

  const refresh = async () => {
    setLoadingBatches(true);
    try {
      const list = await dataApi.listBatches();
      setBatches(list as BatchWithFiles[]);
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  // ---- Upload (delegado al FileUploader, este recibe los File[]) ----
  const handleUpload = async (files: File[]) => {
    if (!choice) throw new Error("Selecciona un grupo o escribe un nombre para crearlo.");

    let batchIdToUse: number;
    if (choice.mode === "existing") {
      batchIdToUse = choice.id;
    } else {
      const name = choice.name.trim() || (
        files.length === 1 ? files[0].name : `Grupo ${new Date().toISOString().slice(0, 19).replace("T", " ")}`
      );
      const created = await dataApi.createBatch(name);
      batchIdToUse = created.id;
    }

    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("batch_id", String(batchIdToUse));
      await dataApi.uploadFile(fd);
    }
    await refresh();
  };

  // ---- Acciones por archivo ----
  const toggleActive = async (f: FileEntry) => { await dataApi.setActive(f.id, !f.is_active); await refresh(); };

  const downloadFile = async (f: FileEntry) => {
    try {
      const { url } = await dataApi.getDownloadUrl(f.id);
      window.open(url, "_blank");
    } catch {
      alert("El archivo aún no está disponible para descarga.");
    }
  };

  const deleteOne = async (f: FileEntry) => {
    if (!confirm(`¿Eliminar "${f.original_filename}"?`)) return;
    await dataApi.deleteFile(f.id);
    await refresh();
  };

  const confirmSelectedInBatch = async (batch: BatchWithFiles) => {
    const ids = batch.files.filter((f) => checkedByFileId[f.id]).map((f) => f.id);
    if (!ids.length) return;
    await dataApi.confirmFilesBulk(ids);
    await refresh();
  };

  // ---- Acciones por batch ----
  const confirmAllInBatch = async (batch: BatchWithFiles) => {
    await dataApi.confirmFilesBulk(batch.files.map((f) => f.id));
    await refresh();
  };

  const deleteAllInBatch = async (batch: BatchWithFiles) => {
    if (!confirm(`¿Eliminar TODOS los archivos del grupo "${batch.name ?? `#${batch.id}`}"?`)) return;
    for (const f of batch.files) { try { await dataApi.deleteFile(f.id); } catch (e) { console.error(e); } }
    await refresh();
    const updated = (await dataApi.listBatches()) as BatchWithFiles[];
    const still = updated.find((b) => b.id === batch.id);
    if (still && still.files.length === 0) {
      try { await dataApi.deleteBatch(batch.id); } catch (e) { console.error(e); } finally { await refresh(); }
    }
  };

  const deleteBatchOnly = async (batch: BatchWithFiles) => {
    if (!confirm(`¿Eliminar el grupo "${batch.name ?? `#${batch.id}`}"?`)) return;
    try { await dataApi.deleteBatch(batch.id); await refresh(); }
    catch (e: any) { alert(e?.message ?? "No se pudo eliminar el grupo. Asegúrate de que no tenga archivos."); }
  };

  const setAllActive = async (batch: BatchWithFiles, value: boolean) => {
    for (const f of batch.files) { try { await dataApi.setActive(f.id, value); } catch (e) { console.error(e); } }
    await refresh();
  };

  // ---- Combobox ----
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return batches;
    return batches.filter((b) => (`${b.name ?? ""}`.toLowerCase().includes(q) || String(b.id).includes(q)));
  }, [batches, query]);

  const batchCombobox = (
    <div className="space-y-1">
      <Label>Grupo (selecciona o escribe para crear)</Label>
      <Popover open={batchOpen} onOpenChange={setBatchOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={batchOpen} className="w-full justify-between">
            {(choice?.mode === "existing"
              ? `#${choice.id} — ${choice.label}`
              : choice?.name ? `Crear: "${choice.name}"` : ""
            ) || "Selecciona un grupo o escribe un nombre nuevo"}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar o crear nuevo grupo..."
              value={query}
              onValueChange={(v) => { setQuery(v); setChoice(v.trim() ? { mode: "new", name: v } : null); }}
            />
            <CommandEmpty>{query.trim() ? <>Crear: "{query.trim()}"</> : <>Sin grupos</>}</CommandEmpty>
            <CommandList>
              <CommandGroup heading="Existentes">
                {filtered.map((b) => {
                  const label = b.name ?? "(sin nombre)";
                  const selected = choice?.mode === "existing" && choice.id === b.id;
                  return (
                    <CommandItem key={b.id} value={String(b.id)} onSelect={() => { setChoice({ mode: "existing", id: b.id, label }); setQuery(label); setBatchOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                      #{b.id} — {label} ({b.files.length})
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {query.trim() && (
                <CommandGroup heading="Crear nuevo">
                  <CommandItem value={`__create__:${query.trim()}`} onSelect={() => { setChoice({ mode: "new", name: query.trim() }); setBatchOpen(false); }}>
                    Crear: "{query.trim()}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  // ---- BatchCard ----
  const BatchCard: React.FC<{ batch: BatchWithFiles }> = ({ batch }) => {
    const counts = batch.files.reduce<Record<string, number>>((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    }, {});

    return (
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-base">
              Grupo #{batch.id}{batch.name ? ` — ${batch.name}` : ""} &bull; {batch.files.length} archivo(s)
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(counts).map(([k, v]) => (
                <Badge key={k} variant="outline" className="text-xs">{STATUS_LABEL[k as FileStatus] ?? k}: {v}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="secondary" onClick={() => confirmAllInBatch(batch)}>
              <CheckSquare className="h-4 w-4 mr-1" /> Confirmar todos
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAllActive(batch, true)}>Activar todos</Button>
            <Button size="sm" variant="outline" onClick={() => setAllActive(batch, false)}>Desactivar todos</Button>
            <Button size="sm" variant="destructive" onClick={() => deleteAllInBatch(batch)}>
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar archivos
            </Button>
            <Button size="sm" variant="destructive" onClick={() => deleteBatchOnly(batch)}>
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar grupo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">Sel.</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Archivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batch.files.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Checkbox
                      checked={!!checkedByFileId[f.id]}
                      disabled={!CONFIRMABLE.includes(f.status as FileStatus)}
                      onCheckedChange={(v) => setCheckedByFileId((p) => ({ ...p, [f.id]: !!v }))}
                    />
                  </TableCell>
                  <TableCell>{f.id}</TableCell>
                  <TableCell className="max-w-[320px] truncate">{f.original_filename}</TableCell>
                  <TableCell><StatusBadge s={f.status as FileStatus} /></TableCell>
                  <TableCell><Switch checked={!!f.is_active} onCheckedChange={() => toggleActive(f)} /></TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadFile(f)}><Download className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteOne(f)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={() => confirmSelectedInBatch(batch)}>
              Confirmar seleccionados
            </Button>
            <span className="text-xs text-muted-foreground">
              {batch.files.filter((f) => checkedByFileId[f.id]).length} seleccionados
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Gestor de Documentos</h1>
        <Button variant="ghost" onClick={() => refresh()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Subir archivos</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader
            onUpload={handleUpload}
            label="Archivos"
            extra={batchCombobox}
          />
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Grupos</h2>
          {loadingBatches && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        {batches.length === 0
          ? <p className="text-sm text-muted-foreground">No hay grupos aún.</p>
          : batches.map((b) => <BatchCard key={b.id} batch={b} />)
        }
      </div>
    </div>
  );
};

export default FilesManagerPage;
