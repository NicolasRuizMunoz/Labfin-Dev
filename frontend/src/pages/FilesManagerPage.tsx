import React, { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText } from "lucide-react";
import * as dataApi from "@/services/data";
import type { FileEntry } from "@/types/data";
import FileUploader from "@/components/FileUploader";
import FileTable from "@/components/FileTable";

const FilesManagerPage: React.FC = () => {
  const { data: grouped = {}, isLoading, refetch } = useQuery({
    queryKey: ["company-files"],
    queryFn: () => dataApi.listFiles(),
  });

  const files: FileEntry[] = React.useMemo(
    () =>
      Object.values(grouped)
        .flat()
        .filter((f: any) => !f.licitacion_id) as FileEntry[],
    [grouped]
  );

  const handleUpload = useCallback(
    async (selectedFiles: File[]) => {
      for (const f of selectedFiles) {
        const fd = new FormData();
        fd.append("file", f);
        await dataApi.uploadFile(fd);
      }
      refetch();
    },
    [refetch]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-gradient-page-header border-b border-border/30">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10">
                <FileText className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Documentos de la Empresa</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Antecedentes que EVA utiliza en cada análisis</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Subir documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader onUpload={handleUpload} label="Documentos de empresa" />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-medium flex items-center gap-2">
            Archivos
            {files.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({files.length})</span>
            )}
          </h2>
          <FileTable
            files={files}
            loading={isLoading}
            onRefetch={() => refetch()}
            emptyMessage="No hay documentos de empresa aún. Sube tus antecedentes para que EVA los use en el análisis."
          />
        </div>
      </div>
    </div>
  );
};

export default FilesManagerPage;
