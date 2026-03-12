import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  ClipboardList,
  BarChart3,
  CheckCircle,
  MessageCircle,
  ArrowRight,
  Search,
  TrendingUp,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AICoach } from '@/components/AICoach';
import { useState } from 'react';

const features = [
  {
    icon: ClipboardList,
    title: 'Gestión de Licitaciones',
    description:
      'Administra todas tus licitaciones en un solo lugar. Sube bases, registra antecedentes y da seguimiento a cada etapa del proceso.',
    href: '/tenders',
    cta: 'Ir a Licitaciones',
  },
  {
    icon: FileText,
    title: 'Documentos de la Empresa',
    description:
      'Centraliza los archivos y antecedentes de tu empresa. Tus documentos quedan indexados y disponibles para que EVA los consulte en cada análisis.',
    href: '/files',
    cta: 'Gestionar Archivos',
  },
  {
    icon: Search,
    title: 'Análisis con EVA',
    description:
      'EVA lee las bases de la licitación y los antecedentes de tu empresa para detectar requisitos clave, evaluar garantías, analizar logística y entregarte una recomendación fundamentada.',
    href: '/tenders',
    cta: 'Ver Análisis',
  },
  {
    icon: BarChart3,
    title: 'Estimaciones y Métricas',
    description:
      'Obtén estimaciones de costos, plazos y punto de equilibrio para distintos escenarios antes de presentar tu oferta.',
    href: '/tenders',
    cta: 'Ver Estimaciones',
  },
];

const steps = [
  {
    number: '01',
    title: 'Sube tus documentos',
    description: 'Carga los antecedentes de tu empresa una sola vez. EVA los indexa automáticamente para usarlos en cada análisis.',
  },
  {
    number: '02',
    title: 'Registra la licitación',
    description: 'Ingresa las bases y documentos del proceso al que quieres postular.',
  },
  {
    number: '03',
    title: 'Analiza con EVA',
    description: 'EVA cruza tus antecedentes con las bases, evalúa garantías, logística y márgenes, y te entrega una recomendación con preguntas clave.',
  },
  {
    number: '04',
    title: 'Decide con datos',
    description: 'Responde las preguntas que EVA no puede responder sola y toma la decisión de postular con información completa.',
  },
];

const highlights = [
  { icon: ShieldCheck, text: 'Datos de tu empresa seguros y bajo tu control' },
  { icon: TrendingUp, text: 'Punto de equilibrio y proyección financiera por licitación' },
  { icon: CheckCircle, text: 'Detección automática de requisitos, garantías y plazos clave' },
  { icon: MessageCircle, text: 'EVA disponible para consultas en lenguaje natural' },
];

const HomePage = () => {
  const [showAICoach, setShowAICoach] = useState(false);

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 px-6">
        <div className="container max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
            Gana más licitaciones
            <span className="block bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
              con EVA
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-4 max-w-3xl mx-auto">
            Plataforma integral para que tu empresa gestione todo el proceso de licitación: desde la carga de antecedentes
            hasta el análisis de bases y las estimaciones de adjudicación.
          </p>
          <p className="text-base text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
            Reduce el tiempo de análisis, detecta requisitos automáticamente y simula distintos escenarios de oferta
            antes de presentar tu propuesta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30"
              asChild
            >
              <Link to="/tenders">
                <ClipboardList className="w-5 h-5 mr-2" />
                Ver Licitaciones
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => setShowAICoach(true)}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Consultar a EVA
            </Button>
          </div>
        </div>
      </section>

      {/* EVA intro */}
      <section className="py-16 px-6">
        <div className="container max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start gap-6 p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Conoce a EVA, tu agente de análisis de licitaciones
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                EVA es el agente de inteligencia artificial de Evalitics. Lee las bases de cada licitación, cruza la
                información con los antecedentes de tu empresa y genera un análisis completo: fechas clave, logística y
                tiempos de abastecimiento, costo del producto, margen estimado, garantías exigidas y los riesgos
                principales. Además, identifica las preguntas que solo tu equipo puede responder — como si tienes caja
                suficiente para la boleta de garantía o si hay ambigüedades en las bases — para que puedas decidir con
                toda la información sobre la mesa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-gradient-subtle">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Cómo funciona</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Un flujo simple para cubrir todo el ciclo de una licitación.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-start">
                <span className="text-4xl font-extrabold text-primary/20 mb-3">{step.number}</span>
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-20 px-6">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Todo en un solo lugar</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Desde la documentación de tu empresa hasta las estimaciones de cada proceso.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="group hover:shadow-elevated transition-all duration-300 bg-gradient-card border-0">
                  <CardHeader className="space-y-3">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors w-fit">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{f.title}</CardTitle>
                    <CardDescription>{f.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="group-hover:border-primary group-hover:text-primary transition-colors" asChild>
                      <Link to={f.href}>
                        {f.cta}
                        <ArrowRight className="w-3 h-3 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 px-6 bg-gradient-subtle">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-2">Diseñado para empresas que licitan</h2>
            <p className="text-muted-foreground">Sin curva de aprendizaje larga — resultados desde el primer proceso.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start space-x-3 p-4 rounded-lg bg-background border border-border/40">
                <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVA floating button */}
      <Button
        onClick={() => setShowAICoach(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-elevated bg-gradient-hero hover:shadow-glow transition-all duration-300 z-50"
        size="icon"
        title="Consultar a EVA"
      >
        <Sparkles className="w-6 h-6" />
      </Button>

      {showAICoach && <AICoach isOpen={showAICoach} onClose={() => setShowAICoach(false)} />}
    </div>
  );
};

export default HomePage;
