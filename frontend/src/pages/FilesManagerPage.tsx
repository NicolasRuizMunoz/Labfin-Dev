import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, Download, RefreshCw, CheckSquare, Upload as UploadIcon } from "lucide-react";

import * as dataApi from "@/services/data";
import type { Batch, FileEntry, FileStatus } from "@/types/data";

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

const BatchUploadAndManager: React.FC = () => {
  // ---- Batches + files (vista principal) ----
  const [batches, setBatches] = useState<BatchWithFiles[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [polling, setPolling] = useState(true);

  // ---- Form de subida ----
  const [selectedBatchId, setSelectedBatchId] = useState<number | "new" | null>(null);
  const [newBatchName, setNewBatchName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Mantener selección de archivos por batch (checkbox para confirmar por archivo dentro del batch)
  const [checkedByFileId, setCheckedByFileId] = useState<Record<number, boolean>>({});

  // ---- Helpers ----
  const refresh = async () => {
    setLoadingBatches(true);
    try {
      const list = await dataApi.listBatches(); // debe devolver batches con "files"
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

  // ---- Subida masiva con creación automática de batch ----
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (files.length === 0) {
      setFormError("Selecciona uno o más archivos.");
      return;
    }

    setUploading(true);
    try {
      let batchIdToUse: number | null = null;

      if (selectedBatchId === "new" || selectedBatchId === null) {
        // Crear batch al vuelo: si no hay nombre, generamos uno
        const name = newBatchName.trim()
          ? newBatchName.trim()
          : (files.length === 1 ? files[0].name : `Batch ${new Date().toISOString().slice(0,19).replace('T',' ')}`);
        const created = await dataApi.createBatch(name);
        batchIdToUse = created.id;
      } else {
        batchIdToUse = selectedBatchId;
      }

      // Subir todos los archivos a ese batch
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("batch_id", String(batchIdToUse));
        await dataApi.uploadFile(fd);
      }

      // Limpiar formulario
      setFiles([]);
      setNewBatchName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Volver a cargar
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

          {/* Acciones para los seleccionados dentro del batch */}
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

      {/* Subida + creación automática de batch */}
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
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
                <div className="text-xs text-muted-foreground">
                  {files.length > 0
                    ? `${files.length} archivo(s) seleccionados`
                    : "No files selected"}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Batch</Label>
                <Select
                  value={selectedBatchId === null ? "new" : String(selectedBatchId)}
                  onValueChange={(v) => setSelectedBatchId(v === "new" ? null : Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="New batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Create new batch</SelectItem>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        #{b.id} — {b.name ?? "(sin nombre)"} ({b.files.length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label>Optional batch name (for new batch)</Label>
                <Input
                  placeholder="e.g., Declaraciones 2024"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  disabled={selectedBatchId !== null && selectedBatchId !== "new"}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={files.length === 0 || uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadIcon className="h-4 w-4 mr-2" />}
                  Upload
                </Button>
              </div>
            </div>

            {formError && <p className="text-xs text-red-600">{formError}</p>}
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

export default BatchUploadAndManager;
