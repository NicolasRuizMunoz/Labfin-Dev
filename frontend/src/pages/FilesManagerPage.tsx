import React, { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RefreshCw } from "lucide-react";
import * as dataApi from "@/services/data";
import type { FileEntry } from "@/types/data";
import FileUploader from "@/components/FileUploader";
import FileTable from "@/components/FileTable";

const FilesManagerPage: React.FC = () => {
  // Todos los archivos de la organización sin licitación (documentos de empresa)
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
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Documentos de la Empresa</h1>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Subir documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader onUpload={handleUpload} label="Documentos de empresa" />
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-3">
        <h2 className="text-lg font-medium">
          Archivos{files.length > 0 ? ` (${files.length})` : ""}
        </h2>
        <FileTable
          files={files}
          loading={isLoading}
          onRefetch={() => refetch()}
          emptyMessage="No hay documentos de empresa aún. Sube tus antecedentes para que EVA los use en el análisis."
        />
      </div>
    </div>
  );
};

export default FilesManagerPage;
