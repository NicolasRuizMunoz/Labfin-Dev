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

const DOT_PATTERN_STYLE = { backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' } as const;

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
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero py-24 px-6">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={DOT_PATTERN_STYLE} />
        <div className="container max-w-5xl mx-auto text-center relative">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Gana más licitaciones
            <span className="block mt-1 text-white/90">
              con <span className="bg-gradient-to-r from-green-300 to-purple-300 bg-clip-text text-transparent">EVA</span>
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/85 mb-4 max-w-3xl mx-auto leading-relaxed">
            Plataforma integral para que tu empresa gestione todo el proceso de licitación: desde la carga de antecedentes
            hasta el análisis de bases y las estimaciones de adjudicación.
          </p>
          <p className="text-base text-white/60 mb-10 max-w-2xl mx-auto">
            Reduce el tiempo de análisis, detecta requisitos automáticamente y simula distintos escenarios de oferta
            antes de presentar tu propuesta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25 transition-all"
              asChild
            >
              <Link to="/tenders">
                <ClipboardList className="w-5 h-5 mr-2" />
                Ver Licitaciones
              </Link>
            </Button>
            <Button
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-white border-0 shadow-lg shadow-secondary/25"
              asChild
            >
              <Link to="/tenders">
                <MessageCircle className="w-5 h-5 mr-2" />
                Consultar a EVA
              </Link>
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
            {steps.map((step, i) => (
              <div key={step.number} className="flex flex-col items-start p-5 rounded-xl bg-card/70 border border-border/30 shadow-card">
                <span className={`text-3xl font-extrabold mb-3 ${i % 2 === 0 ? 'text-primary/25' : 'text-secondary/25'}`}>{step.number}</span>
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
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
            {features.map((f, i) => {
              const Icon = f.icon;
              const isPurple = i % 2 === 1;
              return (
                <Card key={f.title} className="group hover:shadow-elevated transition-all duration-300 bg-gradient-card border border-border/30">
                  <CardHeader className="space-y-3">
                    <div className={`p-3 rounded-lg w-fit transition-colors ${isPurple ? 'bg-secondary/10 group-hover:bg-secondary/20' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
                      <Icon className={`w-6 h-6 ${isPurple ? 'text-secondary' : 'text-primary'}`} />
                    </div>
                    <CardTitle className={`text-lg transition-colors ${isPurple ? 'group-hover:text-secondary' : 'group-hover:text-primary'}`}>{f.title}</CardTitle>
                    <CardDescription className="leading-relaxed">{f.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className={`transition-colors ${isPurple ? 'group-hover:border-secondary group-hover:text-secondary' : 'group-hover:border-primary group-hover:text-primary'}`} asChild>
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
            <h2 className="text-2xl font-bold text-foreground mb-2">Para empresas que quieren vender más y mejor</h2>
            <p className="text-muted-foreground">Sin curva de aprendizaje larga — resultados desde el primer proceso.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {highlights.map(({ icon: Icon, text }, i) => (
              <div key={text} className="flex items-start space-x-3 p-4 rounded-lg bg-card border border-border/30 shadow-card">
                <div className={`p-1.5 rounded-md shrink-0 ${i % 2 === 0 ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                  <Icon className={`w-4 h-4 ${i % 2 === 0 ? 'text-primary' : 'text-secondary'}`} />
                </div>
                <span className="text-sm text-foreground leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
