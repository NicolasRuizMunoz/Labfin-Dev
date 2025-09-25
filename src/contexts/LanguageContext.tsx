import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
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
    startAICoach: 'Start AI Coach',
    exploreMarkets: 'Explore Markets',
    fourModules: 'Four Learning Modules',
    modulesDescription: 'Each module provides hands-on experience with real-world financial scenarios and educational feedback',
    
    // Feature descriptions
    marketsFeatureDesc: 'Practice investing in stocks, ETFs, mutual funds, and cryptocurrencies with realistic market scenarios',
    realEstateFeatureDesc: 'Explore mortgage calculations and rental property investment scenarios',
    creditFeatureDesc: 'Understand loan amortization, interest calculations, and payment strategies',
    retirementFeatureDesc: 'Comprehensive retirement planning tools and calculators',
    
    // Markets Page
    marketsTitle: 'Markets Simulator',
    marketsDescription: 'Practice investing in stocks, ETFs, mutual funds, and cryptocurrencies with realistic market scenarios and live events',
    marketSimulator: 'Market Simulator',
    liveEventGame: 'Live Event Game',
    
    // Markets Cards
    portfolioGrowth: 'Portfolio Growth',
    portfolioGrowthDesc: 'See how your investments could grow over time with different asset allocations and risk levels',
    riskAnalysis: 'Risk Analysis',
    riskAnalysisDesc: 'Understand volatility, maximum drawdown, and risk-adjusted returns for different strategies',
    educationalInsights: 'Educational Insights',
    educationalInsightsDesc: 'Get personalized feedback and learn key investment principles based on your choices',
    
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
    totalInterest: 'Total Interest',
    payoffDate: 'Payoff Date',
    extraPayment: 'Extra Payment',
    
    // Real Estate Cards
    mortgageBasics: 'Mortgage Basics',
    mortgageBasicsDesc: 'Learn about down payments, interest rates, and loan terms for home purchases',
    rentalAnalysis: 'Rental Analysis',
    rentalAnalysisDesc: 'Calculate cash flow, cap rates, and return on investment for rental properties',
    
    // Credit Page
    creditTitle: 'Credit Simulator',
    creditDescription: 'Understand loan amortization, interest calculations, and payment strategies for various types of credit',
    loanCalculator: 'Loan Calculator',
    
    // Credit Cards
    loanAmortization: 'Loan Amortization',
    loanAmortizationDesc: 'Visualize how loan payments are split between principal and interest over time',
    paymentStrategies: 'Payment Strategies',
    paymentStrategiesDesc: 'Compare different payment schedules and see how extra payments can save you money',
    
    // Retirement Page
    retirementTitle: 'Retirement Planning',
    retirementDescription: 'Comprehensive retirement planning tools and calculators to help you prepare for your financial future',
    retirementCalculator: 'Retirement Calculator',
    
    // 401k section
    '401kSimulator': '401(k) Simulator',
    '401kSimulatorDesc': 'Plan your 401(k) contributions and see how employer matching can boost your retirement savings',
    
    // AI Coach
    aiCoach: 'AI Coach',
    aiCoachTitle: 'Your Personal Finance AI Coach',
    aiCoachDescription: 'Get personalized financial guidance and recommendations based on your unique situation and goals.',
    askAQuestion: 'Ask a Question',
    aiCoachPlaceholder: 'Ask me anything about finance, investing, credit, or retirement planning...',
    aiCoachWelcome: 'Hello! I\'m your AI finance coach. I\'m here to help you learn about personal finance, investing, credit management, and retirement planning. What would you like to explore today?',
    send: 'Send',
    typing: 'Typing...',
    
    // Difficulty Levels
    difficultyDescription: 'This affects the complexity of questions and simulations throughout the platform',
    beginnerLevel: 'New to finance, looking for simple explanations and basic concepts',
    mediumLevel: 'Some financial knowledge, ready for intermediate concepts and calculations',
    advancedLevel: 'Strong financial background, interested in complex scenarios and analysis',
    
    // Forms
    loanAmount: 'Loan Amount',
    interestRate: 'Interest Rate',
    loanTerm: 'Loan Term',
    monthlyPayment: 'Monthly Payment',
    calculate: 'Calculate',
    reset: 'Reset',
    years: 'years',
    months: 'months',
    
    // Results
    results: 'Results',
    summary: 'Summary',
    breakdown: 'Breakdown',
    amortizationSchedule: 'Amortization Schedule',
    payment: 'Payment',
    principal: 'Principal',
    interest: 'Interest',
    balance: 'Balance',
    
    // Self Assessment
    selfAssessmentTitle: 'Self-Assessment Test',
    selfAssessmentDescription: 'Discover your current financial knowledge level with our comprehensive assessment',
    startAssessment: 'Start Assessment',
    question: 'Question',
    of: 'of',
    next: 'Next',
    previous: 'Previous',
    finish: 'Finish',
    yourScore: 'Your Score',
    assessmentComplete: 'Assessment Complete!',
    recommendedLevel: 'Recommended Level',
    retakeAssessment: 'Retake Assessment',
    
    // Authentication
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    
    // Social Features
    dailyTest: 'Daily Test',
    friends: 'Friends',
    leaderboard: 'Leaderboard',
    addFriend: 'Add Friend',
    friendRequests: 'Friend Requests',
    accept: 'Accept',
    decline: 'Decline',
    myScore: 'My Score',
    friendsScores: 'Friends Scores',
    globalRanking: 'Global Ranking',
    
    // Daily Test
    dailyTestTitle: 'Daily Finance Test',
    dailyTestDescription: 'Test your financial knowledge with daily questions and compete with friends',
    startDailyTest: 'Start Daily Test',
    testCompleted: 'Test Completed!',
    correctAnswers: 'Correct Answers',
    shareScore: 'Share Score',
    comeBackTomorrow: 'Come back tomorrow for a new test!',
    
    // Friends Panel
    searchFriends: 'Search friends...',
    noFriends: 'No friends yet',
    addFirstFriend: 'Add your first friend to get started!',
    
    // Notifications
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    
    // 404 Page
    pageNotFound: 'Page Not Found',
    pageNotFoundDesc: 'The page you are looking for does not exist.',
    backToHome: 'Back to Home',

    // Authentication Required
    signInToAccess: 'Please sign in to access the daily test and compete with friends',
    alreadyTakenToday: 'Already taken today',
    readyToStart: 'Ready to test your financial knowledge?',
    completedToday: 'Completed Today',
    comeBackTomorrow: 'Come back tomorrow for a new test!',
    viewFriends: 'View Friends',
    viewRankings: 'View Rankings',

    // Additional friend features
    pendingRequests: 'Pending Requests',
    outgoingRequests: 'Outgoing Requests',
    incomingRequests: 'Incoming Requests',
    noRequests: 'No pending requests',
    searchUsers: 'Search users...',
    searchAboveToAdd: 'Search above to add friends',
    friend: 'Friend',
    errorSearchingUsers: 'Error searching users',
    friendRequestSent: 'Friend request sent!',
    errorSendingRequest: 'Error sending friend request',
    errorRespondingToRequest: 'Error responding to request',
    friendRequestAccepted: 'Friend request accepted!',
    friendRequestDeclined: 'Friend request declined',

    // Rankings/Leaderboard
    rankings: 'Rankings',
    seeHowYouCompare: 'See how you compare with friends and others',
    todayGlobal: 'Today - Global',
    topScoresToday: 'Top scores from today\'s daily test',
    friendsPerformance: 'How you and your friends performed today',
    noScoresYet: 'No scores yet',
    takeTestToAppear: 'Take the daily test to appear here',
    you: 'You',

    // Practice Mode
    practiceMode: 'Practice Mode',
    startPracticeTest: 'Start Practice Test',
    practiceTestDesc: 'Practice with immediate feedback and explanations',
    explanation: 'Explanation',
    yourAnswer: 'Your Answer',
    correctAnswer: 'Correct Answer',
    continueToNext: 'Continue to Next Question',
    reviewAnswers: 'Review Answers',
    retakeForLearning: 'Retake for Learning',
    beginnerDescription: 'Simplified questions with basic financial concepts and step-by-step guidance',
    mediumDescription: 'Balanced complexity with intermediate financial concepts and moderate difficulty',
    advancedDescription: 'Complex scenarios with advanced financial analysis and comprehensive concepts',
    
    // Daily Test Questions - Markets
    whatIsCompound: 'What is compound interest?',
    compoundOption1: 'Interest paid only on the original principal',
    compoundOption2: 'Interest earned on both the principal and previously earned interest',
    compoundOption3: 'A type of bank account',
    compoundOption4: 'Monthly fees charged by banks',
    compoundExplanation: 'Compound interest is interest calculated on both the initial principal and the accumulated interest from previous periods.',
    
    whatIsDiversification: 'What is diversification in investing?',
    diversificationOption1: 'Putting all money in one stock',
    diversificationOption2: 'Buying only government bonds',
    diversificationOption3: 'Spreading investments across different assets to reduce risk',
    diversificationOption4: 'Only investing in your home country',
    diversificationExplanation: 'Diversification reduces risk by spreading investments across different assets, sectors, and geographic regions.',
    
    whatIsRiskReturn: 'What is the relationship between risk and return in investing?',
    riskReturnOption1: 'Higher risk investments typically offer higher potential returns',
    riskReturnOption2: 'Risk and return are not related',
    riskReturnOption3: 'Lower risk always means higher returns',
    riskReturnOption4: 'All investments have the same risk level',
    riskReturnExplanation: 'Generally, investments with higher potential risk offer higher returns to compensate investors for taking on additional risk.',
    
    whatIsAssetAllocation: 'What is asset allocation?',
    assetAllocationOption1: 'Buying only one type of investment',
    assetAllocationOption2: 'Dividing investments among different asset classes (stocks, bonds, real estate)',
    assetAllocationOption3: 'Keeping all money in cash',
    assetAllocationOption4: 'Only investing in tech stocks',
    assetAllocationExplanation: 'Asset allocation involves dividing investments among different asset classes to balance risk and reward according to your goals and risk tolerance.',
    
    whatIsBetaVolatility: 'What does Beta measure in finance?',
    betaOption1: 'The total return of an investment',
    betaOption2: 'The dividend yield of a stock',
    betaOption3: 'The volatility of a stock relative to the overall market',
    betaOption4: 'The price-to-earnings ratio',
    betaExplanation: 'Beta measures how much a stock\'s price moves relative to the overall market. A beta of 1 means it moves with the market, above 1 is more volatile, below 1 is less volatile.',
    
    // Daily Test Questions - Real Estate
    whatIsDownPayment: 'What is a down payment in real estate?',
    downPaymentOption1: 'Money paid upfront when buying a house',
    downPaymentOption2: 'Monthly mortgage payment',
    downPaymentOption3: 'Property taxes',
    downPaymentOption4: 'Home insurance premium',
    downPaymentExplanation: 'A down payment is the upfront cash payment made when buying a house, typically expressed as a percentage of the purchase price.',
    
    whatIsPMI: 'What is PMI (Private Mortgage Insurance)?',
    pmiOption1: 'Insurance for the property structure',
    pmiOption2: 'Insurance that protects the lender if you default on your loan',
    pmiOption3: 'Insurance for personal belongings',
    pmiOption4: 'Life insurance for mortgage holders',
    pmiExplanation: 'PMI protects the lender in case you default on your mortgage. It\'s typically required when your down payment is less than 20%.',
    
    whatIsCapRate: 'What is a capitalization rate (cap rate) in real estate?',
    capRateOption1: 'The interest rate on a mortgage',
    capRateOption2: 'Property tax rate',
    capRateOption3: 'Annual rental income divided by property value',
    capRateOption4: 'The down payment percentage',
    capRateExplanation: 'Cap rate is calculated by dividing the annual net operating income by the current market value of the property. It helps evaluate investment property returns.',
    
    // Daily Test Questions - Credit
    whatIsInterestRate: 'What is an interest rate?',
    interestRateOption1: 'The cost of borrowing money, expressed as a percentage',
    interestRateOption2: 'A monthly fee for having a bank account',
    interestRateOption3: 'The amount of money you can borrow',
    interestRateOption4: 'Insurance for your loan',
    interestRateExplanation: 'Interest rate is the percentage charged on the principal amount of borrowed money, representing the cost of the loan.',
    
    whatIsAmortization: 'What is loan amortization?',
    amortizationOption1: 'Paying only interest on a loan',
    amortizationOption2: 'The process of gradually paying off a loan through regular payments',
    amortizationOption3: 'Increasing the loan amount over time',
    amortizationOption4: 'Paying the entire loan amount at once',
    amortizationExplanation: 'Amortization is the process of gradually reducing a debt through regular payments that cover both principal and interest.',
    
    whatIsDebtToIncomeRatio: 'What is debt-to-income ratio?',
    dtiOption1: 'Your total monthly debt payments divided by your gross monthly income',
    dtiOption2: 'Your total assets divided by total debts',
    dtiOption3: 'Your net worth divided by annual income',
    dtiOption4: 'Your credit score divided by income',
    dtiExplanation: 'DTI ratio compares your total monthly debt payments to your gross monthly income. Lenders use it to assess your ability to repay loans.',
    
    // Daily Test Questions - Retirement
    whatIs401k: 'What is a 401(k)?',
    '401kOption1': 'A type of savings account',
    '401kOption2': 'A government pension program',
    '401kOption3': 'An employer-sponsored retirement savings plan',
    '401kOption4': 'A type of mutual fund',
    '401kExplanation': 'A 401(k) is an employer-sponsored retirement savings plan that allows employees to save and invest for retirement with tax advantages.'
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
    totalInterest: 'Interés Total',
    payoffDate: 'Fecha de Pago Final',
    extraPayment: 'Pago Adicional',
    
    // Real Estate Cards
    mortgageBasics: 'Conceptos Básicos de Hipoteca',
    mortgageBasicsDesc: 'Aprende sobre enganches, tasas de interés y términos de préstamo para compra de vivienda',
    rentalAnalysis: 'Análisis de Alquiler',
    rentalAnalysisDesc: 'Calcula flujo de efectivo, tasas de capitalización y retorno de inversión para propiedades de alquiler',
    
    // Credit Page
    creditTitle: 'Simulador de Crédito',
    creditDescription: 'Comprende la amortización de préstamos, cálculos de interés y estrategias de pago para varios tipos de crédito',
    loanCalculator: 'Calculadora de Préstamos',
    
    // Credit Cards
    loanAmortization: 'Amortización de Préstamos',
    loanAmortizationDesc: 'Visualiza cómo los pagos del préstamo se dividen entre capital e interés con el tiempo',
    paymentStrategies: 'Estrategias de Pago',
    paymentStrategiesDesc: 'Compara diferentes calendarios de pago y ve cómo los pagos adicionales pueden ahorrarte dinero',
    
    // Retirement Page
    retirementTitle: 'Planificación de Jubilación',
    retirementDescription: 'Herramientas y calculadoras integrales de planificación de jubilación para ayudarte a prepararte para tu futuro financiero',
    retirementCalculator: 'Calculadora de Jubilación',
    
    // 401k section
    '401kSimulator': 'Simulador 401(k)',
    '401kSimulatorDesc': 'Planifica tus contribuciones 401(k) y ve cómo la contribución patronal puede impulsar tus ahorros de jubilación',
    
    // AI Coach
    aiCoach: 'Entrenador IA',
    aiCoachTitle: 'Tu Entrenador Personal de Finanzas IA',
    aiCoachDescription: 'Obtén orientación financiera personalizada y recomendaciones basadas en tu situación única y objetivos.',
    askAQuestion: 'Haz una Pregunta',
    aiCoachPlaceholder: 'Pregúntame cualquier cosa sobre finanzas, inversiones, crédito o planificación de jubilación...',
    aiCoachWelcome: '¡Hola! Soy tu entrenador de finanzas IA. Estoy aquí para ayudarte a aprender sobre finanzas personales, inversiones, gestión de crédito y planificación de jubilación. ¿Qué te gustaría explorar hoy?',
    send: 'Enviar',
    typing: 'Escribiendo...',
    
    // Difficulty Levels
    difficultyDescription: 'Esto afecta la complejidad de preguntas y simulaciones en toda la plataforma',
    beginnerLevel: 'Nuevo en finanzas, buscando explicaciones simples y conceptos básicos',
    mediumLevel: 'Algo de conocimiento financiero, listo para conceptos intermedios y cálculos',
    advancedLevel: 'Sólidos antecedentes financieros, interesado en escenarios complejos y análisis',
    
    // Forms
    loanAmount: 'Monto del Préstamo',
    interestRate: 'Tasa de Interés',
    loanTerm: 'Plazo del Préstamo',
    monthlyPayment: 'Pago Mensual',
    calculate: 'Calcular',
    reset: 'Restablecer',
    years: 'años',
    months: 'meses',
    
    // Results
    results: 'Resultados',
    summary: 'Resumen',
    breakdown: 'Desglose',
    amortizationSchedule: 'Tabla de Amortización',
    payment: 'Pago',
    principal: 'Capital',
    interest: 'Interés',
    balance: 'Saldo',
    
    // Self Assessment
    selfAssessmentTitle: 'Prueba de Autoevaluación',
    selfAssessmentDescription: 'Descubre tu nivel actual de conocimiento financiero con nuestra evaluación integral',
    startAssessment: 'Comenzar Evaluación',
    question: 'Pregunta',
    of: 'de',
    next: 'Siguiente',
    previous: 'Anterior',
    finish: 'Terminar',
    yourScore: 'Tu Puntuación',
    assessmentComplete: '¡Evaluación Completada!',
    recommendedLevel: 'Nivel Recomendado',
    retakeAssessment: 'Repetir Evaluación',
    
    // Authentication
    signIn: 'Iniciar Sesión',
    signUp: 'Registrarse',
    signOut: 'Cerrar Sesión',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    forgotPassword: '¿Olvidaste la contraseña?',
    dontHaveAccount: '¿No tienes una cuenta?',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    
    // Social Features
    dailyTest: 'Prueba Diaria',
    friends: 'Amigos',
    leaderboard: 'Tabla de Posiciones',
    addFriend: 'Agregar Amigo',
    friendRequests: 'Solicitudes de Amistad',
    accept: 'Aceptar',
    decline: 'Rechazar',
    myScore: 'Mi Puntuación',
    friendsScores: 'Puntuaciones de Amigos',
    globalRanking: 'Clasificación Global',
    
    // Daily Test
    dailyTestTitle: 'Prueba Diaria de Finanzas',
    dailyTestDescription: 'Pon a prueba tu conocimiento financiero con preguntas diarias y compite con amigos',
    startDailyTest: 'Comenzar Prueba Diaria',
    testCompleted: '¡Prueba Completada!',
    correctAnswers: 'Respuestas Correctas',
    shareScore: 'Compartir Puntuación',
    comeBackTomorrow: '¡Vuelve mañana para una nueva prueba!',
    
    // Friends Panel
    searchFriends: 'Buscar amigos...',
    noFriends: 'Aún no hay amigos',
    addFirstFriend: '¡Agrega tu primer amigo para comenzar!',
    
    // Notifications
    loading: 'Cargando',
    error: 'Error',
    success: 'Éxito',
    
    // 404 Page
    pageNotFound: 'Página No Encontrada',
    pageNotFoundDesc: 'La página que buscas no existe.',
    backToHome: 'Volver al Inicio',

    // Social features continued
    authRequired: 'Autenticación Requerida',
    signInToAccess: 'Por favor inicia sesión para acceder a la prueba diaria y competir con amigos',
    alreadyTakenToday: 'Ya has tomado la prueba de hoy',
    readyToStart: '¿Listo para probar tus conocimientos financieros?',
    completedToday: 'Completado Hoy',
    comeBackTomorrow: '¡Vuelve mañana para una nueva prueba!',
    viewFriends: 'Ver Amigos',
    viewRankings: 'Ver Rankings',

    // Additional friend features
    pendingRequests: 'Solicitudes Pendientes',
    outgoingRequests: 'Solicitudes Enviadas',
    incomingRequests: 'Solicitudes Recibidas',
    noRequests: 'No hay solicitudes pendientes',
    searchUsers: 'Buscar usuarios...',
    searchAboveToAdd: 'Busca arriba para agregar amigos',
    friend: 'Amigo',
    errorSearchingUsers: 'Error buscando usuarios',
    friendRequestSent: '¡Solicitud de amistad enviada!',
    errorSendingRequest: 'Error enviando solicitud de amistad',
    errorRespondingToRequest: 'Error respondiendo a la solicitud',
    friendRequestAccepted: '¡Solicitud de amistad aceptada!',
    friendRequestDeclined: 'Solicitud de amistad rechazada',

    // Rankings/Leaderboard
    rankings: 'Rankings',
    seeHowYouCompare: 'Ve cómo te comparas con amigos y otros',
    todayGlobal: 'Hoy - Global',
    topScoresToday: 'Mejores puntuaciones del test diario de hoy',
    friendsPerformance: 'Cómo te desempeñaste tú y tus amigos hoy',
    noScoresYet: 'Aún no hay puntuaciones',
    takeTestToAppear: 'Toma el test diario para aparecer aquí',
    you: 'Tú',

    // Practice Mode
    practiceMode: 'Modo Práctica',
    startPracticeTest: 'Comenzar Prueba de Práctica',
    practiceTestDesc: 'Practica con retroalimentación inmediata y explicaciones',
    explanation: 'Explicación',
    yourAnswer: 'Tu Respuesta',
    correctAnswer: 'Respuesta Correcta',
    continueToNext: 'Continuar a la Siguiente Pregunta',
    reviewAnswers: 'Revisar Respuestas',
    retakeForLearning: 'Repetir para Aprender',
    beginnerDescription: 'Preguntas simplificadas con conceptos financieros básicos y guía paso a paso',
    mediumDescription: 'Complejidad equilibrada con conceptos financieros intermedios y dificultad moderada',
    advancedDescription: 'Escenarios complejos con análisis financiero avanzado y conceptos integrales',
    
    // Daily Test Questions - Markets
    whatIsCompound: '¿Qué es el interés compuesto?',
    compoundOption1: 'Interés pagado solo sobre el capital original',
    compoundOption2: 'Interés ganado tanto sobre el capital como sobre el interés previamente ganado',
    compoundOption3: 'Un tipo de cuenta bancaria',
    compoundOption4: 'Tarifas mensuales cobradas por los bancos',
    compoundExplanation: 'El interés compuesto es el interés calculado tanto sobre el capital inicial como sobre el interés acumulado de períodos anteriores.',
    
    whatIsDiversification: '¿Qué es la diversificación en inversiones?',
    diversificationOption1: 'Poner todo el dinero en una acción',
    diversificationOption2: 'Comprar solo bonos gubernamentales',
    diversificationOption3: 'Distribuir inversiones entre diferentes activos para reducir el riesgo',
    diversificationOption4: 'Solo invertir en tu país de origen',
    diversificationExplanation: 'La diversificación reduce el riesgo distribuyendo las inversiones entre diferentes activos, sectores y regiones geográficas.',
    
    whatIsRiskReturn: '¿Cuál es la relación entre riesgo y rentabilidad en las inversiones?',
    riskReturnOption1: 'Las inversiones de mayor riesgo típicamente ofrecen mayores rendimientos potenciales',
    riskReturnOption2: 'El riesgo y la rentabilidad no están relacionados',
    riskReturnOption3: 'Menor riesgo siempre significa mayores rendimientos',
    riskReturnOption4: 'Todas las inversiones tienen el mismo nivel de riesgo',
    riskReturnExplanation: 'En general, las inversiones con mayor riesgo potencial ofrecen mayores rendimientos para compensar a los inversores por asumir riesgo adicional.',
    
    whatIsAssetAllocation: '¿Qué es la asignación de activos?',
    assetAllocationOption1: 'Comprar solo un tipo de inversión',
    assetAllocationOption2: 'Dividir inversiones entre diferentes clases de activos (acciones, bonos, bienes raíces)',
    assetAllocationOption3: 'Mantener todo el dinero en efectivo',
    assetAllocationOption4: 'Solo invertir en acciones tecnológicas',
    assetAllocationExplanation: 'La asignación de activos implica dividir inversiones entre diferentes clases de activos para equilibrar riesgo y recompensa según tus objetivos y tolerancia al riesgo.',
    
    whatIsBetaVolatility: '¿Qué mide el Beta en finanzas?',
    betaOption1: 'El rendimiento total de una inversión',
    betaOption2: 'El rendimiento por dividendos de una acción',
    betaOption3: 'La volatilidad de una acción relativa al mercado general',
    betaOption4: 'La relación precio-ganancias',
    betaExplanation: 'El Beta mide cuánto se mueve el precio de una acción relativo al mercado general. Un beta de 1 significa que se mueve con el mercado, superior a 1 es más volátil, inferior a 1 es menos volátil.',
    
    // Daily Test Questions - Real Estate
    whatIsDownPayment: '¿Qué es el enganche en bienes raíces?',
    downPaymentOption1: 'Dinero pagado por adelantado al comprar una casa',
    downPaymentOption2: 'Pago mensual de hipoteca',
    downPaymentOption3: 'Impuestos sobre la propiedad',
    downPaymentOption4: 'Prima de seguro de hogar',
    downPaymentExplanation: 'El enganche es el pago en efectivo por adelantado hecho al comprar una casa, típicamente expresado como un porcentaje del precio de compra.',
    
    whatIsPMI: '¿Qué es PMI (Seguro Hipotecario Privado)?',
    pmiOption1: 'Seguro para la estructura de la propiedad',
    pmiOption2: 'Seguro que protege al prestamista si no pagas tu préstamo',
    pmiOption3: 'Seguro para pertenencias personales',
    pmiOption4: 'Seguro de vida para propietarios de hipotecas',
    pmiExplanation: 'PMI protege al prestamista en caso de que no pagues tu hipoteca. Típicamente se requiere cuando tu enganche es menor al 20%.',
    
    whatIsCapRate: '¿Qué es la tasa de capitalización (cap rate) en bienes raíces?',
    capRateOption1: 'La tasa de interés en una hipoteca',
    capRateOption2: 'Tasa de impuestos sobre la propiedad',
    capRateOption3: 'Ingreso anual de alquiler dividido por el valor de la propiedad',
    capRateOption4: 'El porcentaje de enganche',
    capRateExplanation: 'La tasa de capitalización se calcula dividiendo el ingreso operativo neto anual por el valor de mercado actual de la propiedad. Ayuda a evaluar rendimientos de propiedades de inversión.',
    
    // Daily Test Questions - Credit
    whatIsInterestRate: '¿Qué es una tasa de interés?',
    interestRateOption1: 'El costo de pedir dinero prestado, expresado como porcentaje',
    interestRateOption2: 'Una tarifa mensual por tener una cuenta bancaria',
    interestRateOption3: 'La cantidad de dinero que puedes pedir prestado',
    interestRateOption4: 'Seguro para tu préstamo',
    interestRateExplanation: 'La tasa de interés es el porcentaje cobrado sobre el monto principal del dinero prestado, representando el costo del préstamo.',
    
    whatIsAmortization: '¿Qué es la amortización de préstamos?',
    amortizationOption1: 'Pagar solo intereses en un préstamo',
    amortizationOption2: 'El proceso de pagar gradualmente un préstamo a través de pagos regulares',
    amortizationOption3: 'Aumentar el monto del préstamo con el tiempo',
    amortizationOption4: 'Pagar todo el monto del préstamo de una vez',
    amortizationExplanation: 'La amortización es el proceso de reducir gradualmente una deuda a través de pagos regulares que cubren tanto capital como intereses.',
    
    whatIsDebtToIncomeRatio: '¿Qué es la relación deuda-ingresos?',
    dtiOption1: 'Tus pagos mensuales totales de deuda divididos por tus ingresos brutos mensuales',
    dtiOption2: 'Tus activos totales divididos por deudas totales',
    dtiOption3: 'Tu patrimonio neto dividido por ingresos anuales',
    dtiOption4: 'Tu puntuación crediticia dividida por ingresos',
    dtiExplanation: 'La relación DTI compara tus pagos mensuales totales de deuda con tus ingresos brutos mensuales. Los prestamistas la usan para evaluar tu capacidad de pagar préstamos.',
    
    // Daily Test Questions - Retirement
    whatIs401k: '¿Qué es un 401(k)?',
    '401kOption1': 'Un tipo de cuenta de ahorros',
    '401kOption2': 'Un programa gubernamental de pensiones',
    '401kOption3': 'Un plan de ahorros para el retiro patrocinado por el empleador',
    '401kOption4': 'Un tipo de fondo mutuo',
    '401kExplanation': 'Un 401(k) es un plan de ahorros para el retiro patrocinado por el empleador que permite a los empleados ahorrar e invertir para la jubilación con ventajas fiscales.',
    
    // LF Business
    lfBusiness: 'LF Business',
    lfBusinessBadge: 'Educación Tributaria para Pequeñas Empresas',
    lfBusinessTitle: 'LF Business',
    lfBusinessSubtitle: 'Guía tributaria simplificada para propietarios de pequeñas empresas. Aprende sobre formularios fiscales, deducciones, requisitos de cumplimiento y planificación financiera - todo sin la complejidad del software de contabilidad.',
    lfBusinessTagline: 'Enfócate en hacer crecer tu negocio, nosotros te ayudamos a entender el lado tributario.',
    essentialBusinessTopics: 'Temas Tributarios Esenciales para Empresas',
    essentialBusinessTopicsDesc: 'Obtén orientación práctica sobre los temas fiscales y financieros más importantes para pequeñas empresas',
    
    // Business Topics
    taxFormsDeadlines: 'Formularios y Fechas Límite de Impuestos',
    taxFormsDeadlinesDesc: 'Aprende sobre formularios fiscales esenciales para empresas, fechas límite de presentación y requisitos para pequeñas empresas.',
    taxDeductionsCredits: 'Deducciones y Créditos Fiscales',
    taxDeductionsCreditsDesc: 'Descubre gastos comerciales que puedes deducir y créditos fiscales disponibles para pequeñas empresas.',
    businessStructureTax: 'Implicaciones Fiscales de la Estructura Empresarial',
    businessStructureTaxDesc: 'Comprende cómo diferentes estructuras empresariales afectan tus obligaciones y beneficios fiscales.',
    payrollEmployeeTaxes: 'Nómina e Impuestos de Empleados',
    payrollEmployeeTaxesDesc: 'Navega los impuestos de nómina, clasificaciones de empleados y requisitos de cumplimiento.',
    recordKeepingCompliance: 'Mantenimiento de Registros y Cumplimiento',
    recordKeepingComplianceDesc: 'Prácticas esenciales de contabilidad y requisitos de cumplimiento para pequeñas empresas.',
    cashFlowFinancialPlanning: 'Flujo de Efectivo y Planificación Financiera',
    cashFlowFinancialPlanningDesc: 'Conceptos básicos de planificación financiera para ayudar a gestionar el flujo de efectivo y crecimiento empresarial.',
    
    // CTA Section
    needPersonalizedTaxGuidance: '¿Necesitas Orientación Fiscal Personalizada?',
    personalizedTaxGuidanceDesc: 'Nuestro coach de IA puede ayudar a responder preguntas específicas sobre tu situación fiscal empresarial y proporcionar recomendaciones personalizadas basadas en tu tipo de negocio y necesidades.',
    askBusinessTaxCoach: 'Pregunta a Nuestro Coach Fiscal Empresarial de IA'
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