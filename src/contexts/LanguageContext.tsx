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
  console.log('useLanguage hook called, context:', context);
  if (!context) {
    console.error('useLanguage called outside of LanguageProvider');
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
    selfAssessmentTitle: 'Self-Assessment Test',
    assessmentDescription: 'This quick self-assessment will help us understand your goals and risk profile so your simulations fit you better.',
    startAssessment: 'Start Assessment',
    questionProgress: 'Question {{current}} of {{total}}',
    assessmentComplete: 'Assessment Complete!',
    assessmentCompleteDescription: 'Great! Now your simulations will be personalized based on your preferences and tolerance for risk.',
    yourRiskProfile: 'Your Risk Profile',
    recommendedAssets: 'Recommended Assets',
    score: 'Score:',
    timeHorizon: 'Time Horizon:',
    primaryGoal: 'Primary Goal:',
    assetPreference: 'Asset Preference:',
    basedOnProfile: 'Based on your {{profile}} profile:',
    resultsLaved: 'Your results have been saved. The AI Finance Coach will use this profile to provide personalized advice.',
    retakeAssessment: 'Retake Assessment',
    backButton: 'Back',
    nextQuestion: 'Next Question',
    completeAssessment: 'Complete Assessment',
    
    // Risk Profiles
    conservative: 'Conservative',
    moderate: 'Moderate',
    aggressive: 'Aggressive',
    
    // Questions
    financialGoalQuestion: 'What is your main financial objective?',
    timeHorizonQuestion: 'How long are you planning to keep your investments?',
    riskToleranceQuestion: 'How would you react if your portfolio dropped 15% in one month?',
    incomeStabilityQuestion: 'How stable is your current income?',
    assetPreferenceQuestion: 'Which asset type do you feel most comfortable with?',
    marketExperienceQuestion: 'How much experience do you have with investing?',
    volatilityComfortQuestion: 'How comfortable are you with market volatility?',
    emergencyFundQuestion: 'Do you have an emergency fund covering 3-6 months of expenses?',
    
    // Answer Options - Financial Goal
    preservingCapital: 'Preserving capital and steady income',
    buyingHome: 'Buying a home or major purchase',
    buildingWealth: 'Building long-term wealth for retirement',
    passiveIncome: 'Generating passive income',
    
    // Answer Options - Time Horizon
    shortTerm: '1-3 years (Short-term)',
    mediumTerm: '4-7 years (Medium-term)',
    longTerm: '8+ years (Long-term)',
    
    // Answer Options - Risk Tolerance
    sellImmediately: 'Sell immediately to avoid further losses',
    holdAndWait: 'Hold and wait for recovery',
    buyMore: 'Buy more at the lower price',
    
    // Answer Options - Income Stability
    veryStable: 'Very stable (steady job, predictable income)',
    somewhatStable: 'Somewhat stable (occasional fluctuations)',
    unstable: 'Unstable (freelance, commission-based)',
    
    // Answer Options - Asset Preference
    assetFixedIncome: 'Fixed income (bonds, CDs, savings)',
    assetRealEstate: 'Real estate (rental properties, REITs)',
    assetStocksETFs: 'Stocks and ETFs',
    assetAlternative: 'Alternative investments (crypto, commodities)',
    
    // Answer Options - Market Experience
    experienceBeginner: 'Beginner (little to no experience)',
    experienceIntermediate: 'Intermediate (some experience, basic knowledge)',
    experienceAdvanced: 'Advanced (significant experience and knowledge)',
    
    // Answer Options - Volatility Comfort
    preferStability: 'I prefer stability over potential high returns',
    acceptFluctuations: 'I can accept some fluctuations for better returns',
    embraceVolatility: 'I embrace volatility for maximum growth potential',
    
    // Answer Options - Emergency Fund
    solidFund: 'Yes, I have a solid emergency fund',
    partiallyBuilding: 'Partially, working on building it',
    needToBuild: 'No, I need to build one first',
    
    // Asset Recommendations - Conservative
    fixedIncomeBonds: 'Fixed income bonds',
    highYieldSavings: 'High-yield savings',
    conservativeMutualFunds: 'Conservative mutual funds',
    rentalIncomeFocus: 'Real estate (rental income focus)',
    
    // Asset Recommendations - Moderate
    diversifiedETFs: 'Diversified ETFs',
    realEstateInvestment: 'Real estate investment',
    balancedMutualFunds: 'Balanced mutual funds',
    blueChipStocks: 'Blue-chip stocks',
    
    // Asset Recommendations - Aggressive
    growthStocks: 'Growth stocks',
    technologyETFs: 'Technology ETFs',
    appreciationFocus: 'Real estate (appreciation focus)',
    alternativeInvestments: 'Alternative investments',
    
    assessmentTitle: 'Financial Knowledge Assessment',
    assessmentDesc: 'Discover your current financial knowledge level and get personalized learning recommendations.',
    
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
    
    // Mortgage Simulator
    propertyDetails: 'Detalles de la Propiedad',
    propertyDetailsDesc: 'Configura la propiedad y términos del préstamo',
    propertyPrice: 'Precio de la Propiedad',
    propertyPriceTooltip: 'El precio total de compra de la propiedad. Esto determina el monto de tu préstamo basado en tu porcentaje de pago inicial.',
    downPayment: 'Pago Inicial (%)',
    downPaymentTooltip: 'El pago por adelantado que haces al comprar la casa. Pagos iniciales más altos reducen el monto de tu préstamo y pueden ayudarte a evitar PMI (Seguro Hipotecario Privado).',
    interestRate: 'Tasa de Interés (%)',
    interestRateTooltip: 'La tasa de porcentaje anual cobrada por el prestamista. Incluso pequeños cambios (0.5-1%) pueden impactar significativamente tu pago mensual y el interés total pagado durante el término del préstamo.',
    loanTerm: 'Término del Préstamo',
    additionalCosts: 'Costos Adicionales',
    additionalCostsDesc: 'Impuesto anual de propiedad y seguro',
    annualPropertyTax: 'Impuesto Anual de Propiedad',
    annualInsurance: 'Seguro Anual',
    quickOverview: 'Resumen Rápido',
    downPaymentLabel: 'Pago Inicial:',
    loanAmountMortgage: 'Monto del Préstamo:',
    monthlyPI: 'P&I Mensual:',
    taxInsurance: 'Impuesto y Seguro:',
    totalMonthly: 'Total Mensual',
    piPayment: 'Pago P&I',
    totalInterest: 'Interés Total',
    totalPaid: 'Total Pagado',
    equityBuilding: 'Construcción de Capital a lo Largo del Tiempo',
    equityBuildingDesc: 'Cómo crece tu capital inmobiliario mientras pagas la hipoteca',
    amortizationScheduleTable: 'Tabla de Amortización',
    amortizationScheduleTableDesc: 'Desglose detallado mes a mes de tus pagos',
    showSchedule: 'Mostrar Tabla',
    hideSchedule: 'Ocultar Tabla',
    month: 'Mes',
    payment: 'Pago',
    principal: 'Capital',
    interest: 'Interés',
    balance: 'Saldo',
    equity: 'Capital',
    homeEquity: 'Capital Inmobiliario',
    remainingBalance: 'Saldo Restante',
    showingFirst: 'Mostrando los primeros 60 meses de',
    totalPaymentsText: 'pagos totales',
    
    // Down Payment Options
    minimumDown: '5% - Pago inicial mínimo',
    lowDown: '10% - Pago inicial bajo',
    avoidPMI: '20% - Evitar PMI',
    betterRates: '25% - Mejores tasas',
    lowerPayments: '30% - Pagos más bajos',
    
    // Loan Term Options
    fifteenYears: '15 años - Pagos más altos, menos interés',
    twentyYears: '20 años - Enfoque equilibrado',
    thirtyYears: '30 años - Pagos más bajos, más interés',
    
    // Beginner Mortgage
    dreamHome: 'Tu Casa de Ensueño',
    dreamHomeDesc: 'Cuéntanos sobre la casa que quieres',
    homePrice: 'Precio de la Casa',
    homePriceTooltip: 'Este es el costo total de la casa',
    downPaymentBeginner: 'Pago Inicial',
    downPaymentTooltipBeginner: 'Dinero que pagas por adelantado al comprar la casa',
    howLongToPay: 'Cuánto tiempo para pagarlo',
    whatYouPay: 'Lo Que Pagarás',
    whatYouPayDesc: 'Así es como se ve tu préstamo hipotecario',
    monthlyPayment: 'Pago Mensual',
    totalInterestPay: 'Interés Total que Pagarás',
    borrowingCost: 'Este es dinero extra que pagas por pedir prestado',
    whatYouLearned: '¡Lo Que Aprendiste Sobre Préstamos Hipotecarios! 🎓',
    keyThings: '💡 Cosas Clave:',
    tryThis: '🎯 Prueba Esto:',
    
    // Beginner Down Payment Options
    smallDown: '10% - Pago inicial pequeño',
    goodDown: '20% - Buen pago inicial (recomendado)',
    largeDown: '30% - Pago inicial grande',
    
    // Beginner Loan Terms
    payFaster: '15 años - Pagar más rápido, menos interés',
    lowerPaymentsTerm: '30 años - Pagos más bajos, más interés',
    
    // Learning Tips - converted to strings for easier handling
    learningTip1: 'Pago inicial más grande = pago mensual más pequeño',
    learningTip2: 'Préstamo más largo = pago mensual más pequeño pero más interés',
    learningTip3: '¡El interés se suma a mucho durante muchos años!',
    learningTip4: 'El pago mensual permanece igual durante todo el préstamo',
    
    tryTip1: 'Cambia el precio de la casa y ve qué pasa',
    tryTip2: 'Prueba diferentes montos de pago inicial',
    tryTip3: 'Compara 15 años vs 30 años',
    tryTip4: '¿Listo para más? ¡Toma la evaluación para niveles más difíciles!',
    
    // Beginner Intro
    firstHomeLoan: '¡Tu Primera Calculadora de Préstamo Hipotecario! 🏠',
    learnBasics: '¡Aprende los conceptos básicos de comprar una casa! Esta calculadora simple te muestra cuánto pagarás cada mes y cuánto interés pagarás con el tiempo. Usaremos una tasa de interés típica del 6.5% para mantenerlo simple.',
    
    // Assessment 
    assessmentDescription: 'Descubre tu nivel actual de conocimiento financiero y obtén recomendaciones de aprendizaje personalizadas.',
    
    // Difficulty levels
    beginnerLevel: 'Perfecto para quienes son nuevos en finanzas e inversiones',
    mediumLevel: 'Ideal para quienes tienen algo de experiencia financiera',
    advancedLevel: 'Perfecto para inversores experimentados y profesionales financieros',
    
    // Credit Simulators
    yourFirstLoanCalculator: '¡Tu Primera Calculadora de Préstamos! 💳',
    learnHowLoansWork: 'Aprende cómo funcionan los préstamos! Esta calculadora simple te muestra cuánto pagarás cada mes y cuánto dinero extra (interés) pagarás por pedir prestado. Diferentes tipos de préstamos tienen diferentes tasas.',
    yourLoan: 'Tu Préstamo',
    howMuchMoney: '¿Cuánto dinero necesitas?',
    totalAmountBorrow: 'Este es el monto total que quieres pedir prestado',
    whatsLoanFor: '¿Para qué es el préstamo?',
    differentPurposes: 'Diferentes propósitos tienen diferentes tasas de interés',
    howLongPayBack: '¿Cuánto tiempo para pagarlo?',
    carLoan: '🚗 Préstamo de Auto (Interés más bajo)',
    educationLoan: '🎓 Préstamo Educativo (Interés más bajo)',
    personalLoan: '💼 Préstamo Personal (Interés más alto)',
    payFasterLessInterest: 'años - Pagar más rápido, menos interés',
    balancedPayments: 'años - Pagos equilibrados',
    lowerPaymentsMoreInterest: 'años - Pagos más bajos, más interés',
    whatYouPayCredit: 'Lo Que Pagarás',
    hereWhatLooksLike: 'Así es como se ve tu',
    youBorrowed: 'Prestaste',
    extraMoneyPay: 'Dinero Extra que Pagarás (Interés)',
    costOfBorrowing: 'Este es el costo de pedir dinero prestado',
    totalPayBack: 'Total que Pagarás de Vuelta',
    whatLearnedLoans: 'Lo Que Aprendiste Sobre Préstamos! 🎓',
    keyThingsCredit: '💡 Cosas Clave:',
    interestCostBorrowing: 'El interés es el costo de pedir dinero prestado',
    differentLoanTypes: 'Diferentes tipos de préstamos tienen diferentes tasas',
    longerLoans: 'Préstamos más largos = pagos más bajos pero más interés',
    shorterLoans: 'Préstamos más cortos = pagos más altos pero menos interés',
    tryThisCredit: '🎯 Prueba Esto:',
    changeLoanAmount: 'Cambia el monto del préstamo y ve qué pasa',
    tryDifferentTypes: 'Prueba diferentes tipos de préstamos',
    compareYearsVs: 'Compara 2 años vs 5 años de tiempo de pago',
    readyMoreAssessment: 'Listo para más? ¡Toma la evaluación para niveles más difíciles!',
    
    // Market Simulators  
    welcomeFirstInvestment: '¡Bienvenido a Tu Primer Simulador de Inversión!',
    simplifiedVersion: 'Esta versión simplificada te muestra los conceptos básicos de invertir. Aprenderás cómo tu dinero puede crecer con el tiempo a través del poder del crecimiento compuesto - ¡donde tu dinero gana dinero, y luego ese dinero también gana dinero!',
    yourMoney: 'Tu Dinero',
    howMuchInvest: '¿Cuánto puedes invertir?',
    startingAmount: 'Monto Inicial',
    evenSmallAmounts: 'Incluso pequeñas cantidades pueden crecer con el tiempo!',
    monthlySavings: 'Ahorros Mensuales',
    regularSaving: 'El ahorro regular es más importante que la cantidad!',
    timeLetMoneyGrow: 'Tiempo para Dejar Crecer el Dinero:',
    timeYourBestFriend: 'El tiempo es tu mejor amigo al invertir!',
    investmentStyle: 'Estilo de Inversión',
    chooseComfortLevel: 'Elige tu nivel de comodidad',
    safeAndSteady: 'Seguro y Estable',
    likeSavingsAccountBetter: '¡Como una cuenta de ahorros pero mejor!',
    balancedGrowth: 'Crecimiento Equilibrado',
    mixSafetyGrowth: 'Mezcla de seguridad y crecimiento',
    growthFocused: 'Enfocado en Crecimiento',
    higherPotentialReturns: 'Mayores retornos potenciales',
    currentChoice: 'Elección Actual',
    yearlyReturn: 'anual',
    yourMoneyGrowsTo: 'Tu Dinero Crece a',
    moneyYouEarned: 'Dinero que Ganaste',
    moneyYouPutIn: 'Dinero que Pusiste',
    watchMoneyGrow: '¡Mira tu Dinero Crecer! 📈',
    blueLineShows: 'La línea azul muestra cómo crece tu dinero durante',
    totalValue: 'Valor Total',
    contributions: 'Contribuciones',
    // Fixed duplicate whatYouLearned property  
    whatYouLearnedMarkets: '¡Lo Que Aprendiste!',
    keyDiscoveries: '💡 Descubrimientos Clave:',
    moneyGrowsFaster: 'Tu dinero crece más rápido durante períodos más largos',
    regularSavingPowerful: 'El ahorro regular es más poderoso de lo que piensas',
    startingEarlyAdvantage: 'Empezar temprano te da una ventaja enorme',
    differentInvestmentTypes: 'Diferentes tipos de inversión ofrecen diferentes retornos',
    nextStepsMarkets: '🎯 Próximos Pasos:',
    tryDifferentAmounts: 'Prueba diferentes montos y períodos de tiempo',
    compareThreeStyles: 'Compara los tres estilos de inversión',
    playLiveEventGame: 'Juega el Juego de Eventos en Vivo para aprender sobre cambios del mercado',
    readyMoreTakeAssessment: 'Listo para más? ¡Toma la evaluación otra vez para niveles más difíciles!',
    
    // Medium Market Simulator
    mediumLevelInvestment: 'Simulador de Inversión Nivel Intermedio',
    nowCanChoose: '¡Ahora puedes elegir entre diferentes tipos de inversiones! Mezcla activos conservadores, equilibrados y de crecimiento para crear un portafolio que coincida con tu nivel de comodidad. Aprende sobre riesgo vs. recompensa.',
    investmentSettings: 'Configuración de Inversión',
    configureInvestmentPlan: 'Configura tu plan de inversión',
    startingInvestment: 'Inversión Inicial',
    monthlyInvestment: 'Inversión Mensual',
    investmentTime: 'Tiempo de Inversión:',
    longerTimePeriods: 'Los períodos más largos ayudan a suavizar los altibajos del mercado',
    chooseYourInvestments: 'Elige Tus Inversiones',
    pickDiversify: 'Elige 2-3 inversiones para diversificar tu portafolio',
    highYieldSavings: 'Ahorros de Alto Rendimiento',
    verySafeGuaranteed: 'Muy seguro, retornos garantizados como una cuenta bancaria',
    governmentBonds: 'Bonos del Gobierno',
    safeInvestmentsBacked: 'Inversiones seguras respaldadas por el gobierno',
    balancedFund: 'Fondo Equilibrado',
    mixStocksBonds: 'Mezcla de acciones y bonos para crecimiento estable',
    sp500Index: 'Índice S&P 500',
    largestUSCompanies: '500 empresas más grandes de EE.UU. - probado desempeño a largo plazo',
    growthStocks: 'Acciones de Crecimiento',
    companiesExpected: 'Empresas que se espera crezcan más rápido que el promedio',
    technologyETF: 'ETF de Tecnología',
    techCompaniesHigh: 'Empresas tecnológicas con alto potencial de crecimiento',
    conservativeOption: 'conservador',
    balanced: 'equilibrado',
    growth: 'crecimiento',
    diversificationTip: 'Consejo de diversificación:',
    chooseDifferentTypes: 'Elige diferentes tipos (conservador, equilibrado, crecimiento) para reducir el riesgo mientras mantienes el potencial de crecimiento.',
    finalValue: 'Valor Final',
    profitMade: 'Ganancia Obtenida',
    // Removed duplicate yearlyReturn property
    yearlyReturnRate: 'Retorno Anual',
    riskLevel: 'Nivel de Riesgo',
    portfolioGrowthTime: 'Crecimiento del Portafolio a lo Largo del Tiempo',
    seeDiversifiedPortfolio: 'Ve cómo funciona tu portafolio diversificado durante',
    portfolioValue: 'Valor del Portafolio',
    whatYoureLearning: 'Lo Que Estás Aprendiendo',
    portfolioConcepts: '📊 Conceptos del Portafolio:',
    diversification: 'Diversificación:',
    spreadingRisk: 'Distribuir el riesgo entre diferentes inversiones',
    assetClasses: 'Clases de Activos:',
    differentTypesHave: 'Diferentes tipos tienen diferentes perfiles de riesgo/retorno',
    riskVsReturn: 'Riesgo vs. Retorno:',
    higherPotentialReturns2: 'Mayores retornos potenciales generalmente significan mayor riesgo',
    timeHorizon: 'Horizonte Temporal:',
    longerInvestingPeriods: 'Períodos de inversión más largos pueden manejar más volatilidad',
    tryTheseExperimentsMarkets: '🎯 Prueba Estos Experimentos:',
    compareAllConservative: 'Compara portafolios completamente conservadores vs. completamente de crecimiento',
    seeDifferentTimePeriods: 'Ve cómo diferentes períodos de tiempo afectan tus resultados',
    tryLiveEventGame: 'Prueba el Juego de Eventos en Vivo para experimentar la volatilidad del mercado',
    // Advanced Market Simulator (fixed duplicates)
    investmentParameters: 'Parámetros de Inversión',
    configureInvestmentScenario: 'Configura tu escenario de inversión',
    initialInvestment: 'Inversión Inicial',
    monthlyContribution: 'Contribución Mensual', 
    investmentTimeline: 'Cronología de Inversión',
    riskProfile: 'Perfil de Riesgo',
    assetSelection: 'Selección de Activos',
    chooseInvestmentAssets: 'Elige tus activos de inversión',
    finalValueAdvanced: 'Valor Final',
    totalReturn: 'Retorno Total',
    annualReturn: 'Retorno Anual',
    maxDrawdown: 'Máxima Caída',
    // Removed duplicate conservativeOption
    moderateBalanced: 'Moderado (Enfoque equilibrado)',
    aggressiveOption: 'Agresivo',
    
    // Advanced Loan Simulator (fixed duplicates)
    loanDetails: 'Detalles del Préstamo',
    configureLoanParameters: 'Configura los parámetros de tu préstamo',
    loanAmountField: 'Monto del Préstamo',
    annualInterestRate: 'Tasa de Interés Anual (%)',
    loanTermField: 'Plazo del Préstamo',
    extraMonthlyPayment: 'Pago Mensual Extra (Opcional)',
    additionalAmountPrincipal: 'Monto adicional aplicado al capital cada mes',
    loanSummary: 'Resumen del Préstamo',
    keyLoanMetrics: 'Métricas clave del préstamo y comparación',
    standardLoan: 'Préstamo Estándar',
    monthlyPaymentColon: 'Pago Mensual:',
    totalInterestColon: 'Interés Total:',
    payoffDate: 'Fecha de Liquidación:',
    totalPaidColon: 'Total Pagado:',
    monthlyPaymentStat: 'Pago Mensual',
    totalInterestStat: 'Interés Total',
    loanTermStat: 'Plazo del Préstamo',
    totalPaidStat: 'Total Pagado',
    
    
    // Assessment
    selfAssessmentTitle: 'Prueba de Autoevaluación',
    startAssessment: 'Comenzar Evaluación',
    questionProgress: 'Pregunta {{current}} de {{total}}',
    assessmentComplete: '¡Evaluación Completada!',
    assessmentCompleteDescription: '¡Excelente! Ahora tus simulaciones serán personalizadas según tus preferencias y tolerancia al riesgo.',
    yourRiskProfile: 'Tu Perfil de Riesgo',
    recommendedAssets: 'Activos Recomendados',
    score: 'Puntuación:',
    primaryGoal: 'Objetivo Principal:',
    assetPreference: 'Preferencia de Activos:',
    basedOnProfile: 'Basado en tu perfil {{profile}}:',
    resultsLaved: 'Tus resultados han sido guardados. El Coach Financiero de IA utilizará este perfil para proporcionar asesoramiento personalizado.',
    retakeAssessment: 'Repetir Evaluación',
    backButton: 'Atrás',
    nextQuestion: 'Siguiente Pregunta',
    completeAssessment: 'Completar Evaluación',
    
    // Risk Profiles
    conservative: 'Conservador',
    moderate: 'Moderado',
    aggressive: 'Agresivo',
    
    // Questions
    financialGoalQuestion: '¿Cuál es tu objetivo financiero principal?',
    timeHorizonQuestion: '¿Por cuánto tiempo planeas mantener tus inversiones?',
    riskToleranceQuestion: '¿Cómo reaccionarías si tu cartera bajara un 15% en un mes?',
    incomeStabilityQuestion: '¿Qué tan estables son tus ingresos actuales?',
    assetPreferenceQuestion: '¿Con qué tipo de activo te sientes más cómodo?',
    marketExperienceQuestion: '¿Cuánta experiencia tienes invirtiendo?',
    volatilityComfortQuestion: '¿Qué tan cómodo te sientes con la volatilidad del mercado?',
    emergencyFundQuestion: '¿Tienes un fondo de emergencia que cubra 3-6 meses de gastos?',
    
    // Answer Options
    preservingCapital: 'Preservar capital e ingreso estable',
    buyingHome: 'Comprar una casa o una compra importante',
    buildingWealth: 'Construir riqueza a largo plazo para el retiro',
    passiveIncome: 'Generar ingresos pasivos',
    shortTerm: '1-3 años (Corto plazo)',
    mediumTerm: '4-7 años (Mediano plazo)',
    longTerm: '8+ años (Largo plazo)',
    sellImmediately: 'Vender inmediatamente para evitar más pérdidas',
    holdAndWait: 'Mantener y esperar la recuperación',
    buyMore: 'Comprar más a precio más bajo',
    veryStable: 'Muy estables (trabajo fijo, ingresos predecibles)',
    somewhatStable: 'Algo estables (fluctuaciones ocasionales)',
    unstable: 'Inestables (freelance, basado en comisiones)',
    assetFixedIncome: 'Renta fija (bonos, CDs, ahorros)',
    assetRealEstate: 'Bienes raíces (propiedades de alquiler, REITs)',
    assetStocksETFs: 'Acciones y ETFs',
    assetAlternative: 'Inversiones alternativas (cripto, materias primas)',
    experienceBeginner: 'Principiante (poca o ninguna experiencia)',
    experienceIntermediate: 'Intermedio (algo de experiencia, conocimiento básico)',
    experienceAdvanced: 'Avanzado (experiencia significativa y conocimiento)',
    preferStability: 'Prefiero estabilidad sobre posibles altos retornos',
    acceptFluctuations: 'Puedo aceptar algunas fluctuaciones por mejores retornos',
    embraceVolatility: 'Abrazo la volatilidad por máximo potencial de crecimiento',
    solidFund: 'Sí, tengo un fondo de emergencia sólido',
    partiallyBuilding: 'Parcialmente, trabajando en construirlo',
    needToBuild: 'No, necesito construir uno primero',
    
    // Asset Recommendations
    fixedIncomeBonds: 'Bonos de renta fija',
    highYieldSavings: 'Ahorros de alto rendimiento',
    conservativeMutualFunds: 'Fondos mutuos conservadores',
    rentalIncomeFocus: 'Bienes raíces (enfoque en ingresos de alquiler)',
    diversifiedETFs: 'ETFs diversificados',
    realEstateInvestment: 'Inversión en bienes raíces',
    balancedMutualFunds: 'Fondos mutuos balanceados',
    blueChipStocks: 'Acciones blue-chip',
    growthStocks: 'Acciones de crecimiento',
    technologyETFs: 'ETFs de tecnología',
    appreciationFocus: 'Bienes raíces (enfoque en apreciación)',
    alternativeInvestments: 'Inversiones alternativas',
    
    // Common translations
    years: 'años',
  }
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  console.log('LanguageProvider rendering');
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