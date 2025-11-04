import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, Download, RefreshCw } from "lucide-react";

import * as dataApi from "@/services/data";
import type { Batch, GroupedFiles, FileEntry, FileStatus } from "@/types/data";

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

const FilesManagerPage: React.FC = () => {
  // --- Batches ---
  const [batches, setBatches] = useState<Batch[]>([]);
  const [newBatchName, setNewBatchName] = useState("");
  const [loadingBatches, setLoadingBatches] = useState(false);

  // --- Upload form ---
  const [file, setFile] = useState<File | null>(null);
  const [batchId, setBatchId] = useState<number | "">("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // --- Files list ---
  const emptyGrouped: GroupedFiles = useMemo(
    () => ({
      PENDING: [],
      STAGED: [],
      CONFIRMED: [],
      UPLOADED: [],
      ACTIVE: [],
      FAILED: [],
    }),
    []
  );
  const [grouped, setGrouped] = useState<GroupedFiles>(emptyGrouped);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [polling, setPolling] = useState(true);

  // Mantener selección (checkbox) para CONFIRMED sin resetear en cada poll
  const [checkedConfirmed, setCheckedConfirmed] = useState<Record<number, boolean>>({});

  // -------- fetchers ----------
  const refreshBatches = async () => {
    setLoadingBatches(true);
    try {
      const list = await dataApi.listBatches();
      setBatches(list);
    } finally {
      setLoadingBatches(false);
    }
  };

  const refreshFiles = async () => {
    setLoadingFiles(true);
    try {
      const gf = await dataApi.listFiles();
      setGrouped({
        PENDING: gf.PENDING ?? [],
        STAGED: gf.STAGED ?? [],
        CONFIRMED: gf.CONFIRMED ?? [],
        UPLOADED: gf.UPLOADED ?? [],
        ACTIVE: gf.ACTIVE ?? [],
        FAILED: gf.FAILED ?? [],
      });
    } finally {
      setLoadingFiles(false);
    }
  };

  // -------- effects ----------
  useEffect(() => {
    refreshBatches();
    refreshFiles();
  }, []);

  useEffect(() => {
    if (!polling) return;
    const int = setInterval(refreshFiles, 3000);
    return () => clearInterval(int);
  }, [polling]);

  // -------- handlers ----------
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;
    await dataApi.createBatch(newBatchName.trim());
    setNewBatchName("");
    refreshBatches();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!file) {
      setFormError("Debes seleccionar un archivo.");
      return;
    }
    if (batchId === "") {
      setFormError("Debes seleccionar un batch.");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("batch_id", String(batchId));

    setUploading(true);
    try {
      await dataApi.uploadFile(form);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await refreshFiles();
    } catch (err: any) {
      setFormError(err?.message || "Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (f: FileEntry) => {
    await dataApi.setActive(f.id, !f.is_active);
    await refreshFiles();
  };

  const downloadFile = async (f: FileEntry) => {
    try {
      const { url } = await dataApi.getDownloadUrl(f.id);
      window.open(url, "_blank");
    } catch {
      alert("El archivo aún no está disponible para descarga (S3).");
    }
  };

  const deleteFile = async (f: FileEntry) => {
    if (!confirm(`Eliminar ${f.original_filename}?`)) return;
    await dataApi.deleteFile(f.id);
    await refreshFiles();
  };

  // -------- UI ----------
  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  const BatchSelect = (
    <Select
      onValueChange={(v) => setBatchId(v === "none" ? "" : Number(v))}
      value={batchId === "" ? "none" : String(batchId)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select batch" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Selecciona un batch</SelectItem>
        {batches.map((b) => (
          <SelectItem key={b.id} value={String(b.id)}>
            #{b.id} — {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const FileTable: React.FC<{ items: FileEntry[] }> = ({ items }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>File</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Active</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((f) => (
          <TableRow key={f.id}>
            <TableCell>{f.id}</TableCell>
            <TableCell className="max-w-[320px] truncate">{f.original_filename}</TableCell>
            <TableCell><StatusBadge s={f.status as FileStatus} /></TableCell>
            <TableCell>{f.batch_id ?? "-"}</TableCell>
            <TableCell>
              <Switch checked={!!f.is_active} onCheckedChange={() => toggleActive(f)} />
            </TableCell>
            <TableCell className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadFile(f)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteFile(f)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              {(f.status as FileStatus) === "CONFIRMED" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!checkedConfirmed[f.id]}
                    onCheckedChange={(v) =>
                      setCheckedConfirmed((prev) => ({ ...prev, [f.id]: !!v }))
                    }
                  />
                  <span className="text-xs text-muted-foreground">select</span>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const statusOrder: FileStatus[] = ["PENDING", "STAGED", "CONFIRMED", "UPLOADED", "ACTIVE", "FAILED"];

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">File Manager</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setPolling((v) => !v)}>
            {polling ? "Pause polling" : "Resume polling"}
          </Button>
          <Button variant="ghost" onClick={() => refreshFiles()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Create Batch">
          <form onSubmit={handleCreateBatch} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="batchName">Batch name</Label>
              <Input
                id="batchName"
                placeholder="e.g., Carga Impuestos 2024"
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={!newBatchName.trim() || loadingBatches}>
                {loadingBatches ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
              <span className="text-sm text-muted-foreground">{batches.length} batch(es)</span>
            </div>
          </form>
        </Section>

        <Section title="Upload File">
          <form onSubmit={handleUpload} className="space-y-3">
            <div className="space-y-1">
              <Label>File</Label>
              <Input
                ref={inputRef}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {file ? `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)` : "No file selected"}
                </span>
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Batch</Label>
              {BatchSelect}
            </div>

            {formError && <p className="text-xs text-red-600">{formError}</p>}

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={!file || uploading || batchId === ""}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
              </Button>
            </div>
          </form>
        </Section>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Files</h2>
          {loadingFiles && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>

        {statusOrder.map((status) => (
          <Card key={status}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <StatusBadge s={status} />
                <span className="text-muted-foreground">
                  {grouped[status]?.length ?? 0} file(s)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {grouped[status] && grouped[status].length > 0 ? (
                <FileTable items={grouped[status]} />
              ) : (
                <p className="text-sm text-muted-foreground">No files in this state.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FilesManagerPage;
