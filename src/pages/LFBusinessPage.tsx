import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, FileText, Calculator, AlertTriangle, DollarSign, Building, Users } from 'lucide-react';
import { AICoach } from '@/components/AICoach';
import { useLanguage } from '@/contexts/LanguageContext';

const LFBusinessPage = () => {
  const { t, language } = useLanguage();
  const [showAICoach, setShowAICoach] = useState(false);

  const businessTopics = [
    {
      title: t('taxFormsDeadlines'),
      description: t('taxFormsDeadlinesDesc'),
      icon: FileText,
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      content: language === 'es' ? [
        "Formulario 1040 Anexo C para propietarios únicos",
        "Formulario 1120S para S-Corporations", 
        "Formulario 1065 para sociedades",
        "Pagos de impuestos estimados trimestrales (Formulario 1040ES)",
        "Fechas límite de presentación anual y extensiones"
      ] : [
        "Form 1040 Schedule C for sole proprietorships",
        "Form 1120S for S-Corporations", 
        "Form 1065 for partnerships",
        "Quarterly estimated tax payments (Form 1040ES)",
        "Annual filing deadlines and extensions"
      ]
    },
    {
      title: t('taxDeductionsCredits'),
      description: t('taxDeductionsCreditsDesc'),
      icon: Calculator,
      color: "bg-green-500/10 text-green-600 border-green-200",
      content: language === 'es' ? [
        "Gastos de oficina y deducción de oficina en casa",
        "Equipo comercial y depreciación",
        "Gastos de viaje y comidas",
        "Desarrollo profesional y capacitación",
        "Créditos fiscales para pequeñas empresas (I+D, Oportunidad de Trabajo, etc.)"
      ] : [
        "Office expenses and home office deduction",
        "Business equipment and depreciation",
        "Travel and meal expenses",
        "Professional development and training",
        "Small business tax credits (R&D, Work Opportunity, etc.)"
      ]
    },
    {
      title: t('businessStructureTax'),
      description: t('businessStructureTaxDesc'),
      icon: Building,
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
      content: language === 'es' ? [
        "Propietario único vs LLC vs Corporación",
        "Consideraciones de impuestos de trabajo por cuenta propia",
        "Impuestos directos vs doble tributación",
        "Requisitos de impuestos estatales por tipo de negocio",
        "Cuándo considerar cambiar la estructura empresarial"
      ] : [
        "Sole Proprietorship vs LLC vs Corporation",
        "Self-employment tax considerations",
        "Pass-through vs double taxation",
        "State tax requirements by business type",
        "When to consider changing business structure"
      ]
    },
    {
      title: t('payrollEmployeeTaxes'),
      description: t('payrollEmployeeTaxesDesc'),
      icon: Users,
      color: "bg-orange-500/10 text-orange-600 border-orange-200",
      content: language === 'es' ? [
        "Clasificación de empleado vs contratista independiente",
        "Cálculos de impuestos de nómina (FICA, FUTA, SUTA)",
        "Requisitos de Formulario W-2 y 1099",
        "Horarios de depósito de impuestos de nómina",
        "Requisitos de seguro de desempleo estatal"
      ] : [
        "Employee vs independent contractor classification",
        "Payroll tax calculations (FICA, FUTA, SUTA)",
        "Form W-2 and 1099 requirements",
        "Payroll tax deposit schedules",
        "State unemployment insurance requirements"
      ]
    },
    {
      title: t('recordKeepingCompliance'),
      description: t('recordKeepingComplianceDesc'),
      icon: AlertTriangle,
      color: "bg-red-500/10 text-red-600 border-red-200",
      content: language === 'es' ? [
        "Registros comerciales requeridos y períodos de retención",
        "Seguimiento de gastos y gestión de recibos",
        "Mejores prácticas de separación de cuentas bancarias",
        "Recolección y remisión de impuestos sobre ventas",
        "Preparación de auditorías y documentación"
      ] : [
        "Required business records and retention periods",
        "Expense tracking and receipt management",
        "Bank account separation best practices",
        "Sales tax collection and remittance",
        "Audit preparation and documentation"
      ]
    },
    {
      title: t('cashFlowFinancialPlanning'),
      description: t('cashFlowFinancialPlanningDesc'),
      icon: DollarSign,
      color: "bg-teal-500/10 text-teal-600 border-teal-200",
      content: language === 'es' ? [
        "Conceptos básicos de pronóstico de flujo de efectivo",
        "Apartar dinero para pagos de impuestos",
        "Planificación de fondo de emergencia empresarial",
        "Entender ganancia vs flujo de efectivo",
        "Resumen básico de estados financieros"
      ] : [
        "Cash flow forecasting basics",
        "Setting aside money for tax payments",
        "Business emergency fund planning",
        "Understanding profit vs cash flow",
        "Basic financial statements overview"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="py-20 px-6 text-center">
        <div className="container max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            {t('lfBusinessBadge')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {t('lfBusinessTitle')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('lfBusinessSubtitle')}
          </p>
          <p className="text-lg text-primary font-semibold">
            {t('lfBusinessTagline')}
          </p>
        </div>
      </section>

      {/* Business Topics Grid */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('essentialBusinessTopics')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('essentialBusinessTopicsDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessTopics.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <Card key={index} className="h-full hover:shadow-elevated transition-all duration-300 group">
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-lg ${topic.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl">{topic.title}</CardTitle>
                    <CardDescription>{topic.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {topic.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-sm text-muted-foreground flex items-start">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 px-6 bg-gradient-card">
        <div className="container max-w-4xl mx-auto text-center">
          <Card className="bg-background/80 backdrop-blur-sm border-0 shadow-elevated">
            <CardContent className="py-12 px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t('needPersonalizedTaxGuidance')}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t('personalizedTaxGuidanceDesc')}
              </p>
              <Button 
                size="lg"
                onClick={() => setShowAICoach(true)}
                className="bg-gradient-hero hover:shadow-glow transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {t('askBusinessTaxCoach')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* AI Coach Modal */}
      {showAICoach && (
        <AICoach 
          isOpen={showAICoach}
          onClose={() => setShowAICoach(false)}
          webhookUrl="https://n8n.srv1004834.hstgr.cloud/webhook/ceff8144-41db-4f93-a17b-dd578fb92383"
          disableAssessment={true}
        />
      )}

      {/* Fixed AI Coach Button */}
      <Button
        onClick={() => setShowAICoach(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-elevated bg-gradient-hero hover:shadow-glow transition-all duration-300 z-50"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default LFBusinessPage;