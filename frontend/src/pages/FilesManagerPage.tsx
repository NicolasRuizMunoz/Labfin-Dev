import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Upload as UploadIcon,
  ChevronsUpDown,
  Check,
} from "lucide-react";

import * as dataApi from "@/services/data";
import type { Batch, FileEntry, FileStatus } from "@/types/data";
import { cn } from "@/lib/utils";

function StatusBadge({ s }: { s: FileStatus }) {
  const style: Record<FileStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-900",
    STAGED: "bg-zinc-100 text-zinc-900",
    CONFIRMED: "bg-green-100 text-green-900",
    UPLOADED: "bg-blue-100 text-blue-900",
    ACTIVE: "bg-indigo-100 text-indigo-900",
    FAILED: "bg-red-100 text-red-900",
  };
  return <Badge className={style[s]}>{s}</Badge>;
}

type BatchWithFiles = Batch & { files: FileEntry[] };
type BatchChoice =
  | { mode: "existing"; id: number; label: string }
  | { mode: "new"; name: string };

const FilesManagerPage: React.FC = () => {
  // ---- Batches + files ----
  const [batches, setBatches] = useState<BatchWithFiles[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [polling, setPolling] = useState(true);

  // ---- Form de subida ----
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Combobox (un solo control para seleccionar o crear)
  const [batchOpen, setBatchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [choice, setChoice] = useState<BatchChoice | null>(null);

  // Selección por archivo (para Confirm selected)
  const [checkedByFileId, setCheckedByFileId] = useState<Record<number, boolean>>({});

  // ---- Fetch ----
  const refresh = async () => {
    setLoadingBatches(true);
    try {
      const list = await dataApi.listBatches(); // debe incluir files
      setBatches(list as BatchWithFiles[]);
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [polling]);

  // ---- Upload ----
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (files.length === 0) {
      setFormError("Selecciona uno o más archivos.");
      return;
    }
    if (!choice) {
      setFormError("Selecciona un batch o escribe un nombre para crearlo.");
      return;
    }

    setUploading(true);
    try {
      let batchIdToUse: number;

      if (choice.mode === "existing") {
        batchIdToUse = choice.id;
      } else {
        const name = choice.name.trim()
          ? choice.name.trim()
          : (files.length === 1 ? files[0].name : `Batch ${new Date().toISOString().slice(0,19).replace('T',' ')}`);
        const created = await dataApi.createBatch(name);
        batchIdToUse = created.id;
      }

      // Subir todos los archivos a ese batch (secuencial para mantener logs ordenados; puedes usar Promise.all si quieres)
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("batch_id", String(batchIdToUse));
        await dataApi.uploadFile(fd);
      }

      // Limpiar formulario
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refresh();
    } catch (err: any) {
      setFormError(err?.message ?? "Error al subir archivos");
    } finally {
      setUploading(false);
    }
  };

  // ---- Acciones por archivo ----
  const toggleActive = async (f: FileEntry) => {
    await dataApi.setActive(f.id, !f.is_active);
    await refresh();
  };

  const downloadFile = async (f: FileEntry) => {
    try {
      const { url } = await dataApi.getDownloadUrl(f.id);
      window.open(url, "_blank");
    } catch {
      alert("El archivo aún no está disponible para descarga (S3).");
    }
  };

  const deleteOne = async (f: FileEntry) => {
    if (!confirm(`Eliminar ${f.original_filename}?`)) return;
    await dataApi.deleteFile(f.id);
    await refresh();
  };

  const confirmSelectedInBatch = async (batch: BatchWithFiles) => {
    const ids = batch.files
      .filter((f) => checkedByFileId[f.id])
      .map((f) => f.id);
    if (ids.length === 0) return;
    await dataApi.confirmFilesBulk(ids);
    await refresh();
  };

  // ---- Acciones por batch ----
  const confirmAllInBatch = async (batch: BatchWithFiles) => {
    const ids = batch.files.map((f) => f.id);
    await dataApi.confirmFilesBulk(ids);
    await refresh();
  };

  const deleteAllInBatch = async (batch: BatchWithFiles) => {
    if (!confirm(`Eliminar TODOS los archivos del batch "${batch.name ?? `#${batch.id}`}"?`)) return;
    for (const f of batch.files) {
      try { await dataApi.deleteFile(f.id); } catch {}
    }
    await refresh();
  };

  const setAllActive = async (batch: BatchWithFiles, value: boolean) => {
    for (const f of batch.files) {
      try { await dataApi.setActive(f.id, value); } catch {}
    }
    await refresh();
  };

  // ---- Combobox ----
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return batches;
    return batches.filter(b =>
      (`${b.name ?? ""}`.toLowerCase().includes(q) || String(b.id).includes(q))
    );
  }, [batches, query]);

  const currentLabel =
    choice?.mode === "existing"
      ? `#${choice.id} — ${choice.label}`
      : (choice?.name ? `Create: “${choice.name}”` : "");

  // ---- UI ----
  const BatchCard: React.FC<{ batch: BatchWithFiles }> = ({ batch }) => {
    const total = batch.files.length;
    const counts = batch.files.reduce<Record<FileStatus, number>>((acc, f) => {
      acc[f.status as FileStatus] = (acc[f.status as FileStatus] || 0) + 1;
      return acc;
    }, {} as any);

    return (
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-base">
              Batch #{batch.id}{batch.name ? ` — ${batch.name}` : ""} • {total} file(s)
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(counts).map(([k, v]) => (
                <Badge key={k} variant="outline" className="text-xs">{k}: {v}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => confirmAllInBatch(batch)}>
              <CheckSquare className="h-4 w-4 mr-2" /> Confirm all
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAllActive(batch, true)}>
              Set all Active
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAllActive(batch, false)}>
              Set all Inactive
            </Button>
            <Button size="sm" variant="destructive" onClick={() => deleteAllInBatch(batch)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">Sel.</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batch.files.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Checkbox
                      checked={!!checkedByFileId[f.id]}
                      onCheckedChange={(v) => setCheckedByFileId((p) => ({ ...p, [f.id]: !!v }))}
                    />
                  </TableCell>
                  <TableCell>{f.id}</TableCell>
                  <TableCell className="max-w-[320px] truncate">{f.original_filename}</TableCell>
                  <TableCell><StatusBadge s={f.status as FileStatus} /></TableCell>
                  <TableCell>
                    <Switch checked={!!f.is_active} onCheckedChange={() => toggleActive(f)} />
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadFile(f)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteOne(f)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={() => confirmSelectedInBatch(batch)}>
              Confirm selected
            </Button>
            <span className="text-xs text-muted-foreground">
              {batch.files.filter((f) => checkedByFileId[f.id]).length} selected
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Document Batches</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setPolling((v) => !v)}>
            {polling ? "Pause polling" : "Resume polling"}
          </Button>
          <Button variant="ghost" onClick={() => refresh()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upload files (auto-batch)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label>Files</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    setFiles((prev) => {
                      const map = new Map(prev.map(f => [`${f.name}::${f.size}`, f]));
                      for (const f of picked) map.set(`${f.name}::${f.size}`, f);
                      return Array.from(map.values());
                    });
                  }}
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {files.length === 0
                      ? "No files selected"
                      : files.length === 1
                        ? `Selected: ${files[0].name} (${Math.round(files[0].size / 1024)} KB)`
                        : `${files.length} archivos seleccionados`}
                  </div>
                  {files.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setFiles([]);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {files.length > 1 && (
                  <ul className="mt-2 text-xs space-y-1">
                    {files.map((f, i) => (
                      <li key={`${f.name}-${f.size}-${i}`} className="flex items-center justify-between">
                        <span className="truncate max-w-[420px]">{f.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-6 px-2"
                          onClick={() => setFiles((prev) => prev.filter((_, pi) => pi !== i))}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-1">
                <Label>Batch (select or type to create)</Label>
                <Popover open={batchOpen} onOpenChange={setBatchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={batchOpen}
                      className="w-full justify-between"
                    >
                      {(
                        choice?.mode === "existing"
                          ? `#${choice.id} — ${choice.label}`
                          : (choice?.name ? `Create: “${choice.name}”` : "")
                      ) || "Select a batch or type a new name"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Type to search or create..."
                        value={query}
                        onValueChange={(v) => {
                          setQuery(v);
                          if (v.trim().length > 0) {
                            setChoice({ mode: "new", name: v });
                          } else {
                            setChoice(null);
                          }
                        }}
                      />
                      <CommandEmpty>
                        {query.trim().length > 0 ? <>Create: “{query.trim()}”</> : <>No batches</>}
                      </CommandEmpty>
                      <CommandList>
                        <CommandGroup heading="Existing">
                          {filtered.map((b) => {
                            const label = `${b.name ?? "(sin nombre)"}`;
                            const selected = choice?.mode === "existing" && choice.id === b.id;
                            return (
                              <CommandItem
                                key={b.id}
                                value={String(b.id)}
                                onSelect={() => {
                                  setChoice({ mode: "existing", id: b.id, label });
                                  setQuery(label);
                                  setBatchOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                                #{b.id} — {label} ({b.files.length})
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                        {query.trim().length > 0 && (
                          <CommandGroup heading="Create new">
                            <CommandItem
                              value={`__create__:${query.trim()}`}
                              onSelect={() => {
                                setChoice({ mode: "new", name: query.trim() });
                                setBatchOpen(false);
                              }}
                            >
                              Create: “{query.trim()}”
                            </CommandItem>
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {formError && <p className="text-xs text-red-600">{formError}</p>}
              <div className="flex items-center gap-2 ml-auto">
                <Button type="submit" disabled={files.length === 0 || uploading || !choice}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadIcon className="h-4 w-4 mr-2" />}
                  Upload
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Batches</h2>
          {loadingBatches && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>

        {batches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay batches aún.</p>
        ) : (
          batches.map((b) => <BatchCard key={b.id} batch={b} />)
        )}
      </div>
    </div>
  );
};

export default FilesManagerPage;
