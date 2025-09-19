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
    
    // Home Page
    welcomeTitle: 'Master Your Financial Future',
    welcomeSubtitle: 'Learn investing, real estate, and credit management through interactive simulations tailored to your experience level.',
    
    // Markets
    marketsTitle: 'Markets Simulator',
    marketsDescription: 'Practice investing in stocks, bonds, and other securities without risking real money. Learn portfolio management and understand market dynamics.',
    portfolioGrowth: 'Portfolio Growth',
    portfolioGrowthDesc: 'Track your virtual investments and see how different strategies perform over time.',
    riskAnalysis: 'Risk Analysis',
    riskAnalysisDesc: 'Learn to evaluate and manage investment risks across different asset classes.',
    educationalInsights: 'Educational Insights',
    educationalInsightsDesc: 'Get real-time explanations of market movements and investment decisions.',
    
    // Real Estate
    realEstateTitle: 'Real Estate Simulator',
    realEstateDescription: 'Explore mortgage calculations and rental property investments to make informed real estate decisions.',
    monthlyPayments: 'Monthly Payments',
    monthlyPaymentsDesc: 'Calculate mortgage payments with different loan terms and interest rates.',
    amortizationSchedule: 'Amortization Schedule',
    amortizationScheduleDesc: 'See how your payments are split between principal and interest over time.',
    totalCostAnalysis: 'Total Cost Analysis',
    totalCostAnalysisDesc: 'Understand the true cost of homeownership including taxes and insurance.',
    
    // Credit
    creditTitle: 'Credit & Loan Simulator',
    creditDescription: 'Master loan calculations, understand interest rates, and learn strategies to pay off debt efficiently.',
    loanCalculator: 'Loan Calculator',
    loanCalculatorDesc: 'Calculate monthly payments and total interest for various loan types.',
    extraPaymentImpact: 'Extra Payment Impact',
    extraPaymentImpactDesc: 'See how additional payments can save you thousands in interest.',
    
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
    
    // Home Page
    welcomeTitle: 'Domina Tu Futuro Financiero',
    welcomeSubtitle: 'Aprende inversiones, bienes raíces y gestión de crédito a través de simulaciones interactivas adaptadas a tu nivel de experiencia.',
    
    // Markets
    marketsTitle: 'Simulador de Mercados',
    marketsDescription: 'Practica invirtiendo en acciones, bonos y otros valores sin arriesgar dinero real. Aprende gestión de portafolios y comprende la dinámica del mercado.',
    portfolioGrowth: 'Crecimiento del Portafolio',
    portfolioGrowthDesc: 'Rastrea tus inversiones virtuales y observa cómo diferentes estrategias funcionan con el tiempo.',
    riskAnalysis: 'Análisis de Riesgo',
    riskAnalysisDesc: 'Aprende a evaluar y gestionar riesgos de inversión en diferentes clases de activos.',
    educationalInsights: 'Perspectivas Educativas',
    educationalInsightsDesc: 'Obtén explicaciones en tiempo real de movimientos del mercado y decisiones de inversión.',
    
    // Real Estate
    realEstateTitle: 'Simulador de Bienes Raíces',
    realEstateDescription: 'Explora cálculos hipotecarios e inversiones en propiedades de alquiler para tomar decisiones informadas sobre bienes raíces.',
    monthlyPayments: 'Pagos Mensuales',
    monthlyPaymentsDesc: 'Calcula pagos hipotecarios con diferentes términos de préstamo y tasas de interés.',
    amortizationSchedule: 'Tabla de Amortización',
    amortizationScheduleDesc: 'Ve cómo tus pagos se dividen entre capital e intereses a lo largo del tiempo.',
    totalCostAnalysis: 'Análisis de Costo Total',
    totalCostAnalysisDesc: 'Comprende el costo real de ser propietario incluyendo impuestos y seguros.',
    
    // Credit
    creditTitle: 'Simulador de Crédito y Préstamos',
    creditDescription: 'Domina los cálculos de préstamos, comprende las tasas de interés y aprende estrategias para pagar deudas eficientemente.',
    loanCalculator: 'Calculadora de Préstamos',
    loanCalculatorDesc: 'Calcula pagos mensuales e interés total para varios tipos de préstamos.',
    extraPaymentImpact: 'Impacto de Pagos Adicionales',
    extraPaymentImpactDesc: 'Ve cómo los pagos adicionales pueden ahorrarte miles en intereses.',
    
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
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};