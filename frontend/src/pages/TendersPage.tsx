import { ClipboardList, Upload, Search, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TendersPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-primary" />
              Licitaciones
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra y analiza los procesos de licitación de tu empresa.
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Licitación
          </Button>
        </div>

        {/* Empty state / coming soon */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-gradient-card border-0">
            <CardHeader>
              <div className="p-2 rounded-lg bg-primary/10 w-fit mb-2">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-base">Subir Bases</CardTitle>
              <CardDescription>
                Carga las bases de la licitación para que el asistente IA las analice automáticamente.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card border-0">
            <CardHeader>
              <div className="p-2 rounded-lg bg-primary/10 w-fit mb-2">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-base">Análisis de Requisitos</CardTitle>
              <CardDescription>
                Detecta automáticamente los requisitos que debes cumplir y compáralos con tus antecedentes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card border-0">
            <CardHeader>
              <div className="p-2 rounded-lg bg-primary/10 w-fit mb-2">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-base">Estimaciones</CardTitle>
              <CardDescription>
                Simula distintos escenarios de oferta y obtén proyecciones de adjudicación esperadas.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Placeholder list */}
        <Card>
          <CardContent className="py-20 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No hay licitaciones aún</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Agrega tu primera licitación para comenzar el análisis. Asegúrate de tener los documentos de tu empresa
              cargados en File Manager.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Licitación
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default TendersPage;