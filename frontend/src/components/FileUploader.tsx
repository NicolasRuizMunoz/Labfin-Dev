import React, { useRef, useState } from 'react';
import { Loader2, Upload as UploadIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateFileMime, MAX_FILE_SIZE_BYTES } from '@/lib/sanitize';

const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'csv', 'docx', 'xlsx', 'xls', 'pptx'];
const ACCEPTED_EXTENSIONS_DISPLAY = ALLOWED_EXTENSIONS.join(', ');
const ACCEPTED_MIME =
  '.pdf,.txt,.csv,.docx,.xlsx,.xls,.pptx,' +
  'application/pdf,text/plain,text/csv,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'application/vnd.ms-excel,' +
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

interface FileUploaderProps {
  /** Llamado con los archivos seleccionados al hacer submit. Si lanza, se muestra el error. */
  onUpload: (files: File[]) => Promise<void>;
  label?: string;
  accept?: string;
  disabled?: boolean;
  extra?: React.ReactNode;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  label = 'Archivos',
  accept = ACCEPTED_MIME,
  disabled = false,
  extra,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = (picked: File[]): { valid: File[]; rejected: { name: string; reason: string }[] } => {
    const valid: File[] = [];
    const rejected: { name: string; reason: string }[] = [];
    for (const f of picked) {
      const ext = getExtension(f.name);
      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        rejected.push({ name: f.name, reason: `extensión .${ext || '(ninguna)'} no permitida` });
      } else if (f.size > MAX_FILE_SIZE_BYTES) {
        rejected.push({ name: f.name, reason: `supera el límite de ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB` });
      } else if (!validateFileMime(f, ext)) {
        rejected.push({ name: f.name, reason: 'tipo de archivo no coincide con la extensión' });
      } else {
        valid.push(f);
      }
    }
    return { valid, rejected };
  };

  const addFiles = (picked: File[]) => {
    const { valid, rejected } = validateFiles(picked);

    if (rejected.length > 0) {
      const names = rejected.map((r) => `"${r.name}" (${r.reason})`).join(', ');
      setError(
        `${rejected.length === 1 ? 'El archivo' : 'Los archivos'} ${names} ${rejected.length === 1 ? 'fue rechazado' : 'fueron rechazados'}. ` +
        `Formatos aceptados: ${ACCEPTED_EXTENSIONS_DISPLAY}. Tamaño máximo: ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`
      );
    } else {
      setError(null);
    }

    if (valid.length === 0) return;

    setFiles((prev) => {
      const map = new Map(prev.map((f) => [`${f.name}::${f.size}`, f]));
      for (const f of valid) map.set(`${f.name}::${f.size}`, f);
      return Array.from(map.values());
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clear = () => {
    setFiles([]);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (files.length === 0) {
      setError('Selecciona al menos un archivo.');
      return;
    }
    setUploading(true);
    try {
      await onUpload(files);
      clear();
    } catch (err: any) {
      const raw = err?.message ?? 'Error al subir archivos.';
      // Humanize common backend messages
      const msg = raw.startsWith('Extensión no permitida')
        ? `${raw} Formatos aceptados: ${ACCEPTED_EXTENSIONS_DISPLAY}.`
        : raw;
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-5 space-y-3">
      {extra}

      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <Input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          disabled={disabled || uploading}
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
          className="bg-card border-border/40"
        />
        <p className="text-xs text-muted-foreground">
          Formatos aceptados: {ACCEPTED_EXTENSIONS_DISPLAY}
        </p>

        {files.length > 0 && (
          <div className="space-y-1 mt-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {files.length === 1
                  ? `${files[0].name} (${Math.round(files[0].size / 1024)} KB)`
                  : `${files.length} archivos seleccionados`}
              </span>
              <Button type="button" variant="ghost" className="h-6 px-2 text-xs" onClick={clear}>
                Limpiar
              </Button>
            </div>

            {files.length > 1 && (
              <ul className="text-xs space-y-0.5 rounded-md bg-background/60 p-2">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
                    <span className="truncate max-w-sm text-muted-foreground">{f.name}</span>
                    <button
                      type="button"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(i)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" disabled={files.length === 0 || uploading || disabled} className="gap-2">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UploadIcon className="h-4 w-4" />
        )}
        {uploading ? 'Subiendo...' : 'Subir'}
      </Button>
    </form>
  );
};

export default FileUploader;
