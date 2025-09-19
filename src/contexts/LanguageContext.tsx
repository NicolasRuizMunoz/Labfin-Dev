import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Navigation
    home: 'Home',
    markets: 'Markets',
    realEstate: 'Real Estate',
    credit: 'Credit',
    selfAssessment: 'Self-Assessment Test',
    retirement: 'Retirement',
    
    // Common
    comingSoon: 'Coming Soon',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    takeAssessment: 'Take Assessment',
    beginner: 'Beginner',
    medium: 'Medium',
    advanced: 'Advanced',
    recommended: 'Recommended',
    learningLevel: 'Learning Level',
    changeLevel: 'Change Level',
    cancel: 'Cancel',
    defaultLevel: 'Default',
    takeAssessmentPersonalized: 'Take assessment for personalized level',
    difficultyLevel: 'Difficulty Level',
    tutorial: 'Tutorial',
    variable: 'Variable',
    low: 'Low',
    interactive: 'Interactive',
    
    // Home Page
    welcomeTitle: 'Master Finance with',
    welcomeTitleHighlight: 'LabFin Simulations',
    welcomeSubtitle: 'Master personal finance through interactive simulations. Practice investing, real estate, credit management, and retirement planning in a risk-free environment.',
    startAICoach: 'Start with AI Coach',
    exploreMarkets: 'Explore Markets',
    fourModules: 'Four Learning Modules',
    modulesDescription: 'Each module provides hands-on experience with real financial scenarios and educational feedback',
    
    // Feature descriptions
    marketsFeatureDesc: 'Practice investing in stocks, ETFs, mutual funds, and crypto with realistic market scenarios',
    realEstateFeatureDesc: 'Explore mortgage calculations and rental property investment scenarios',
    creditFeatureDesc: 'Understand loan amortization, interest calculations, and payment strategies',
    retirementFeatureDesc: 'Comprehensive retirement planning tools and calculators',
    
    // Markets Page
    marketsTitle: 'Markets Simulator',
    marketsDescription: 'Practice investing in stocks, ETFs, mutual funds, and crypto with realistic market scenarios and live events',
    marketSimulator: 'Market Simulator',
    liveEventGame: 'Live Event Game',
    
    // Markets Cards
    portfolioGrowth: 'Portfolio Growth',
    portfolioGrowthDesc: 'See how your investments could grow over time with different asset allocations and risk levels',
    riskAnalysis: 'Risk Analysis',
    riskAnalysisDesc: 'Understand volatility, maximum drawdown, and risk-adjusted returns for different strategies',
    educationalInsights: 'Educational Insights',
    educationalInsightsDesc: 'Get personalized feedback and learn key investing principles based on your choices',
    
    // Live Event Game
    liveEventPortfolioGame: 'Live Event Portfolio Game',
    liveEventDescription: 'Build a portfolio and respond to real market events. Make buy/hold/sell decisions and see how they impact your returns.',
    realEvents: 'Real Events',
    realEventsDesc: 'Market news, earnings, policy changes',
    quickDecisions: 'Quick Decisions',
    quickDecisionsDesc: 'Buy, Hold, or Sell in real-time',
    learnImprove: 'Learn & Improve',
    learnImproveDesc: 'Get feedback on your choices',
    
    // Real Estate Page
    realEstateTitle: 'Real Estate Simulator',
    realEstateDescription: 'Explore mortgage calculations for home buying and rental property investment scenarios',
    primaryHomeMortgage: 'Primary Home Mortgage',
    rentalInvestment: 'Rental Investment',
    monthlyPayments: 'Monthly Payments',
    monthlyPaymentsDesc: 'Calculate exact monthly payments based on price, down payment, and interest rate',
    amortizationSchedule: 'Amortization Schedule',
    amortizationScheduleDesc: 'See how much goes to principal vs interest over time and track equity building',
    totalCostAnalysis: 'Total Cost Analysis',
    totalCostAnalysisDesc: 'Understand the total interest paid and how different terms affect overall cost',
    rentalPropertyInvestment: 'Rental Property Investment',
    rentalPropertyDesc: 'Analyze rental property investments with cap rates, cash flow, and appreciation scenarios',
    cashFlowAnalysis: 'Cash Flow Analysis',
    cashFlowAnalysisDesc: 'Monthly rent vs expenses',
    marketEvents: 'Market Events',
    marketEventsDesc: 'Economic factors affecting returns',
    roiMetrics: 'ROI Metrics',
    roiMetricsDesc: 'Cap rate, IRR, and total returns',
    
    // Credit Page
    creditTitle: 'Credit & Loan Simulator',
    creditDescription: 'Understand loan amortization, interest calculations, and payment optimization strategies',
    loanCalculator: 'Loan Calculator',
    loanCalculatorDesc: 'Calculate monthly payments, total interest, and see how different terms affect your loan',
    extraPaymentImpact: 'Extra Payment Impact',
    extraPaymentImpactDesc: 'See how extra monthly payments can save thousands in interest and shorten loan terms',
    amortizationScheduleCredit: 'Amortization Schedule',
    amortizationScheduleCreditDesc: 'Detailed month-by-month breakdown of principal vs interest payments over time',
    creditManagementLearning: 'Credit Management Learning',
    creditManagementDesc: 'Master the fundamentals of loan management and interest optimization',
    keyConcepts: 'Key Concepts You\'ll Learn:',
    smartPaymentStrategies: 'Smart Payment Strategies:',
    conceptsItems: ['How interest is calculated and compounded', 'The impact of loan term length on total cost', 'Principal vs interest payment allocation', 'Strategies for early loan payoff'],
    strategiesItems: ['Make bi-weekly payments instead of monthly', 'Apply windfalls directly to principal', 'Consider refinancing when rates drop', 'Pay high-interest debt first (avalanche method)'],
    
    // Assessment
    assessmentTitle: 'Financial Knowledge Assessment',
    assessmentDescription: 'Discover your current financial knowledge level and get personalized learning recommendations.',
    
    // Difficulty levels
    beginnerLevel: 'Perfect for those new to finance and investing',
    mediumLevel: 'Great for those with some financial experience',
    advancedLevel: 'Ideal for experienced investors and financial professionals'
  },
  es: {
    // Navigation
    home: 'Inicio',
    markets: 'Mercados',
    realEstate: 'Bienes Raíces',
    credit: 'Crédito',
    selfAssessment: 'Prueba de Autoevaluación',
    retirement: 'Jubilación',
    
    // Common
    comingSoon: 'Próximamente',
    getStarted: 'Comenzar',
    learnMore: 'Saber Más',
    takeAssessment: 'Tomar Evaluación',
    beginner: 'Principiante',
    medium: 'Intermedio',
    advanced: 'Avanzado',
    recommended: 'Recomendado',
    learningLevel: 'Nivel de Aprendizaje',
    changeLevel: 'Cambiar Nivel',
    cancel: 'Cancelar',
    defaultLevel: 'Por Defecto',
    takeAssessmentPersonalized: 'Tomar evaluación para nivel personalizado',
    difficultyLevel: 'Nivel de Dificultad',
    tutorial: 'Tutorial',
    variable: 'Variable',
    low: 'Bajo',
    interactive: 'Interactivo',
    
    // Home Page
    welcomeTitle: 'Domina las Finanzas con',
    welcomeTitleHighlight: 'Simulaciones LabFin',
    welcomeSubtitle: 'Domina las finanzas personales mediante simulaciones interactivas. Practica inversiones, bienes raíces, gestión de crédito y planificación de jubilación en un entorno libre de riesgos.',
    startAICoach: 'Comenzar con Entrenador IA',
    exploreMarkets: 'Explorar Mercados',
    fourModules: 'Cuatro Módulos de Aprendizaje',
    modulesDescription: 'Cada módulo proporciona experiencia práctica con escenarios financieros reales y retroalimentación educativa',
    
    // Feature descriptions
    marketsFeatureDesc: 'Practica invirtiendo en acciones, ETFs, fondos mutuos y criptomonedas con escenarios de mercado realistas',
    realEstateFeatureDesc: 'Explora cálculos hipotecarios y escenarios de inversión en propiedades de alquiler',
    creditFeatureDesc: 'Comprende la amortización de préstamos, cálculos de interés y estrategias de pago',
    retirementFeatureDesc: 'Herramientas y calculadoras integrales de planificación de jubilación',
    
    // Markets Page
    marketsTitle: 'Simulador de Mercados',
    marketsDescription: 'Practica invirtiendo en acciones, ETFs, fondos mutuos y criptomonedas con escenarios de mercado realistas y eventos en vivo',
    marketSimulator: 'Simulador de Mercado',
    liveEventGame: 'Juego de Eventos en Vivo',
    
    // Markets Cards
    portfolioGrowth: 'Crecimiento del Portafolio',
    portfolioGrowthDesc: 'Ve cómo tus inversiones podrían crecer con el tiempo con diferentes asignaciones de activos y niveles de riesgo',
    riskAnalysis: 'Análisis de Riesgo',
    riskAnalysisDesc: 'Comprende la volatilidad, máxima caída y retornos ajustados al riesgo para diferentes estrategias',
    educationalInsights: 'Perspectivas Educativas',
    educationalInsightsDesc: 'Obtén retroalimentación personalizada y aprende principios clave de inversión basados en tus elecciones',
    
    // Live Event Game
    liveEventPortfolioGame: 'Juego de Portafolio de Eventos en Vivo',
    liveEventDescription: 'Construye un portafolio y responde a eventos de mercado reales. Toma decisiones de comprar/mantener/vender y ve cómo impactan tus retornos.',
    realEvents: 'Eventos Reales',
    realEventsDesc: 'Noticias del mercado, ganancias, cambios de política',
    quickDecisions: 'Decisiones Rápidas',
    quickDecisionsDesc: 'Comprar, Mantener o Vender en tiempo real',
    learnImprove: 'Aprender y Mejorar',
    learnImproveDesc: 'Obtén retroalimentación sobre tus elecciones',
    
    // Real Estate Page
    realEstateTitle: 'Simulador de Bienes Raíces',
    realEstateDescription: 'Explora cálculos hipotecarios para compra de vivienda y escenarios de inversión en propiedades de alquiler',
    primaryHomeMortgage: 'Hipoteca de Vivienda Principal',
    rentalInvestment: 'Inversión de Alquiler',
    monthlyPayments: 'Pagos Mensuales',
    monthlyPaymentsDesc: 'Calcula pagos mensuales exactos basados en precio, pago inicial y tasa de interés',
    amortizationSchedule: 'Tabla de Amortización',
    amortizationScheduleDesc: 'Ve cuánto va al capital vs interés con el tiempo y rastrea la acumulación de capital',
    totalCostAnalysis: 'Análisis de Costo Total',
    totalCostAnalysisDesc: 'Comprende el interés total pagado y cómo diferentes términos afectan el costo general',
    rentalPropertyInvestment: 'Inversión en Propiedad de Alquiler',
    rentalPropertyDesc: 'Analiza inversiones en propiedades de alquiler con tasas cap, flujo de efectivo y escenarios de apreciación',
    cashFlowAnalysis: 'Análisis de Flujo de Efectivo',
    cashFlowAnalysisDesc: 'Alquiler mensual vs gastos',
    marketEvents: 'Eventos del Mercado',
    marketEventsDesc: 'Factores económicos que afectan los retornos',
    roiMetrics: 'Métricas de ROI',
    roiMetricsDesc: 'Tasa cap, IRR y retornos totales',
    
    // Credit Page
    creditTitle: 'Simulador de Crédito y Préstamos',
    creditDescription: 'Comprende la amortización de préstamos, cálculos de interés y estrategias de optimización de pagos',
    loanCalculator: 'Calculadora de Préstamos',
    loanCalculatorDesc: 'Calcula pagos mensuales, interés total y ve cómo diferentes términos afectan tu préstamo',
    extraPaymentImpact: 'Impacto de Pagos Adicionales',
    extraPaymentImpactDesc: 'Ve cómo los pagos mensuales adicionales pueden ahorrar miles en interés y acortar los términos del préstamo',
    amortizationScheduleCredit: 'Tabla de Amortización',
    amortizationScheduleCreditDesc: 'Desglose detallado mes a mes de pagos de capital vs interés a lo largo del tiempo',
    creditManagementLearning: 'Aprendizaje de Gestión de Crédito',
    creditManagementDesc: 'Domina los fundamentos de la gestión de préstamos y optimización de intereses',
    keyConcepts: 'Conceptos Clave que Aprenderás:',
    smartPaymentStrategies: 'Estrategias de Pago Inteligentes:',
    conceptsItems: ['Cómo se calcula y capitaliza el interés', 'El impacto de la duración del préstamo en el costo total', 'Asignación de pagos de capital vs interés', 'Estrategias para el pago anticipado del préstamo'],
    strategiesItems: ['Hacer pagos quincenales en lugar de mensuales', 'Aplicar ganancias inesperadas directamente al capital', 'Considerar refinanciar cuando las tasas bajen', 'Pagar primero la deuda de alto interés (método avalancha)'],
    
    // Assessment
    assessmentTitle: 'Evaluación de Conocimiento Financiero',
    assessmentDescription: 'Descubre tu nivel actual de conocimiento financiero y obtén recomendaciones de aprendizaje personalizadas.',
    
    // Difficulty levels
    beginnerLevel: 'Perfecto para quienes son nuevos en finanzas e inversiones',
    mediumLevel: 'Ideal para quienes tienen algo de experiencia financiera',
    advancedLevel: 'Perfecto para inversores experimentados y profesionales financieros'
  }
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    const value = translations[language][key as keyof typeof translations['en']];
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};