import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Brain, Target, TrendingUp, Home, CreditCard, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDifficultyLevel } from '@/lib/difficultyLevel';

interface Question {
  id: string;
  module: 'markets' | 'realEstate' | 'credit' | 'retirement';
  difficulty: 'beginner' | 'medium' | 'advanced';
  questionKey: string;
  options: string[];
  correctAnswer: number;
  explanationKey: string;
}

interface TestResult {
  score: number;
  totalQuestions: number;
  moduleScores: Record<string, { correct: number; total: number }>;
  completedAt: string;
}

const DailyTestPage = () => {
  const { t } = useLanguage();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [userDifficulty, setUserDifficulty] = useState<'beginner' | 'medium' | 'advanced'>('advanced');
  const [hasStarted, setHasStarted] = useState(false);

  // Question bank based on difficulty
  const questionBank: Question[] = [
    // Markets - Beginner
    {
      id: 'markets_beginner_1',
      module: 'markets',
      difficulty: 'beginner',
      questionKey: 'whatIsCompound',
      options: ['compoundOption1', 'compoundOption2', 'compoundOption3', 'compoundOption4'],
      correctAnswer: 1,
      explanationKey: 'compoundExplanation'
    },
    {
      id: 'markets_beginner_2',
      module: 'markets',
      difficulty: 'beginner',
      questionKey: 'whatIsDiversification',
      options: ['diversificationOption1', 'diversificationOption2', 'diversificationOption3', 'diversificationOption4'],
      correctAnswer: 2,
      explanationKey: 'diversificationExplanation'
    },
    // Markets - Medium
    {
      id: 'markets_medium_1',
      module: 'markets',
      difficulty: 'medium',
      questionKey: 'whatIsRiskReturn',
      options: ['riskReturnOption1', 'riskReturnOption2', 'riskReturnOption3', 'riskReturnOption4'],
      correctAnswer: 0,
      explanationKey: 'riskReturnExplanation'
    },
    {
      id: 'markets_medium_2',
      module: 'markets',
      difficulty: 'medium',
      questionKey: 'whatIsAssetAllocation',
      options: ['assetAllocationOption1', 'assetAllocationOption2', 'assetAllocationOption3', 'assetAllocationOption4'],
      correctAnswer: 1,
      explanationKey: 'assetAllocationExplanation'
    },
    // Markets - Advanced
    {
      id: 'markets_advanced_1',
      module: 'markets',
      difficulty: 'advanced',
      questionKey: 'whatIsBetaVolatility',
      options: ['betaOption1', 'betaOption2', 'betaOption3', 'betaOption4'],
      correctAnswer: 2,
      explanationKey: 'betaExplanation'
    },
    // Real Estate Questions
    {
      id: 'realestate_beginner_1',
      module: 'realEstate',
      difficulty: 'beginner',
      questionKey: 'whatIsDownPayment',
      options: ['downPaymentOption1', 'downPaymentOption2', 'downPaymentOption3', 'downPaymentOption4'],
      correctAnswer: 0,
      explanationKey: 'downPaymentExplanation'
    },
    {
      id: 'realestate_medium_1',
      module: 'realEstate',
      difficulty: 'medium',
      questionKey: 'whatIsPMI',
      options: ['pmiOption1', 'pmiOption2', 'pmiOption3', 'pmiOption4'],
      correctAnswer: 1,
      explanationKey: 'pmiExplanation'
    },
    {
      id: 'realestate_advanced_1',
      module: 'realEstate',
      difficulty: 'advanced',
      questionKey: 'whatIsCapRate',
      options: ['capRateOption1', 'capRateOption2', 'capRateOption3', 'capRateOption4'],
      correctAnswer: 2,
      explanationKey: 'capRateExplanation'
    },
    // Credit Questions
    {
      id: 'credit_beginner_1',
      module: 'credit',
      difficulty: 'beginner',
      questionKey: 'whatIsInterestRate',
      options: ['interestRateOption1', 'interestRateOption2', 'interestRateOption3', 'interestRateOption4'],
      correctAnswer: 0,
      explanationKey: 'interestRateExplanation'
    },
    {
      id: 'credit_medium_1',
      module: 'credit',
      difficulty: 'medium',
      questionKey: 'whatIsAmortization',
      options: ['amortizationOption1', 'amortizationOption2', 'amortizationOption3', 'amortizationOption4'],
      correctAnswer: 1,
      explanationKey: 'amortizationExplanation'
    },
    {
      id: 'credit_advanced_1',
      module: 'credit',
      difficulty: 'advanced',
      questionKey: 'whatIsDebtToIncomeRatio',
      options: ['dtiOption1', 'dtiOption2', 'dtiOption3', 'dtiOption4'],
      correctAnswer: 0,
      explanationKey: 'dtiExplanation'
    },
    // Retirement Questions
    {
      id: 'retirement_beginner_1',
      module: 'retirement',
      difficulty: 'beginner',
      questionKey: 'whatIs401k',
      options: ['401kOption1', '401kOption2', '401kOption3', '401kOption4'],
      correctAnswer: 2,
      explanationKey: '401kExplanation'
    }
  ];

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'markets':
        return <TrendingUp className="w-4 h-4" />;
      case 'realEstate':
        return <Home className="w-4 h-4" />;
      case 'credit':
        return <CreditCard className="w-4 h-4" />;
      case 'retirement':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'markets':
        return 'bg-blue-100 text-blue-800';
      case 'realEstate':
        return 'bg-green-100 text-green-800';
      case 'credit':
        return 'bg-orange-100 text-orange-800';
      case 'retirement':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter questions based on user difficulty
  const getQuestionsForTest = () => {
    const filteredQuestions = questionBank.filter(q => q.difficulty === userDifficulty);
    // Select 2 questions per module (8 total)
    const moduleQuestions: Record<string, Question[]> = {};
    
    filteredQuestions.forEach(q => {
      if (!moduleQuestions[q.module]) moduleQuestions[q.module] = [];
      moduleQuestions[q.module].push(q);
    });

    const selectedQuestions: Question[] = [];
    Object.values(moduleQuestions).forEach(questions => {
      // Take up to 2 questions per module
      selectedQuestions.push(...questions.slice(0, 2));
    });

    return selectedQuestions.slice(0, 8); // Limit to 8 questions total
  };

  const [testQuestions, setTestQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const difficulty = getDifficultyLevel();
    setUserDifficulty(difficulty);
  }, []);

  useEffect(() => {
    if (hasStarted) {
      setTestQuestions(getQuestionsForTest());
    }
  }, [hasStarted, userDifficulty]);

  const handleStartTest = () => {
    setHasStarted(true);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setSelectedAnswer(null);
    setIsCompleted(false);
    setResult(null);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = selectedAnswer;
    setSelectedAnswers(newAnswers);

    if (currentQuestion < testQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      completeTest(newAnswers);
    }
  };

  const completeTest = (answers: number[]) => {
    let correctCount = 0;
    const moduleScores: Record<string, { correct: number; total: number }> = {};

    testQuestions.forEach((question, index) => {
      const isCorrect = answers[index] === question.correctAnswer;
      if (isCorrect) correctCount++;

      if (!moduleScores[question.module]) {
        moduleScores[question.module] = { correct: 0, total: 0 };
      }
      moduleScores[question.module].total++;
      if (isCorrect) moduleScores[question.module].correct++;
    });

    const testResult: TestResult = {
      score: Math.round((correctCount / testQuestions.length) * 100),
      totalQuestions: testQuestions.length,
      moduleScores,
      completedAt: new Date().toISOString()
    };

    setResult(testResult);
    setIsCompleted(true);

    // Save to localStorage
    const today = new Date().toDateString();
    localStorage.setItem(`dailyTest_${today}`, JSON.stringify(testResult));
  };

  const resetTest = () => {
    setHasStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setSelectedAnswer(null);
    setIsCompleted(false);
    setResult(null);
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('dailyFinanceTest')}</h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t('dailyTestDescription')}
            </p>
            <div className="mb-6">
              <Badge className="text-lg px-4 py-2">
                {t('difficultyLevel')}: {t(userDifficulty)}
              </Badge>
            </div>
            <Button onClick={handleStartTest} size="lg">
              {t('startDailyTest')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted && result) {
    return (
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('testCompleted')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('yourScore')}: {result.score}% ({result.totalQuestions - Math.round((result.score / 100) * result.totalQuestions)} {t('wrongAnswers')})
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('overallPerformance')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{result.score}%</div>
                  <Progress value={result.score} className="mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {Math.round((result.score / 100) * result.totalQuestions)} {t('of')} {result.totalQuestions} {t('correct')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('moduleBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(result.moduleScores).map(([module, scores]) => (
                  <div key={module} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getModuleIcon(module)}
                      <span className="text-sm font-medium">{t(module)}</span>
                    </div>
                    <Badge className={getModuleColor(module)}>
                      {scores.correct}/{scores.total}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button onClick={resetTest} variant="outline" className="mr-4">
              {t('retakeTest')}
            </Button>
            <Button onClick={() => window.location.href = '/'}>
              {t('backToHome')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = testQuestions[currentQuestion];
  if (!currentQ) return null;

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="container max-w-3xl mx-auto">
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('question')} {currentQuestion + 1} {t('of')} {testQuestions.length}</span>
              <span>{Math.round(((currentQuestion + 1) / testQuestions.length) * 100)}%</span>
            </div>
            <Progress value={((currentQuestion + 1) / testQuestions.length) * 100} />
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge className={getModuleColor(currentQ.module)}>
                  {getModuleIcon(currentQ.module)}
                  <span className="ml-1">{t(currentQ.module)}</span>
                </Badge>
                <Badge variant="outline">{t(userDifficulty)}</Badge>
              </div>
              <CardTitle className="text-xl">
                {t(currentQ.questionKey)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQ.options.map((optionKey, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === index ? "default" : "outline"}
                  className="w-full text-left justify-start h-auto py-4 px-4"
                  onClick={() => handleAnswerSelect(index)}
                >
                  {String.fromCharCode(65 + index)}. {t(optionKey)}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              {t('previous')}
            </Button>
            <Button
              onClick={handleNext}
              disabled={selectedAnswer === null}
            >
              {currentQuestion === testQuestions.length - 1 ? t('finishTest') : t('next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyTestPage;