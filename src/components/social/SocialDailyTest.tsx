import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Brain, Target, TrendingUp, Home, CreditCard, Calendar, Users, Trophy, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { getDifficultyLevel } from '@/lib/difficultyLevel';
import { supabase } from '@/integrations/supabase/client';
import FriendsPanel from './FriendsPanel';
import Leaderboard from './Leaderboard';
import { toast } from 'sonner';

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

const SocialDailyTest = () => {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [userDifficulty, setUserDifficulty] = useState<'beginner' | 'medium' | 'advanced'>('advanced');
  const [hasStarted, setHasStarted] = useState(false);
  const [activeTab, setActiveTab] = useState('test');
  const [hasAlreadyTakenTest, setHasAlreadyTakenTest] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentQuestionResult, setCurrentQuestionResult] = useState<{
    isCorrect: boolean;
    userAnswer: number;
    correctAnswer: number;
  } | null>(null);

  // Question bank based on difficulty
  const questionBank: Question[] = [
    // Markets - Beginner
    {
      id: 'markets_beginner_1',
      module: 'markets',
      difficulty: 'beginner',
      questionKey: 'whatIsCompoundInterest',
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
    if (user) {
      checkIfAlreadyTakenTest();
    }
  }, [user]);

  useEffect(() => {
    if (hasStarted) {
      setTestQuestions(getQuestionsForTest());
    }
  }, [hasStarted, userDifficulty]);

  const checkIfAlreadyTakenTest = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('test_results')
      .select('id')
      .eq('user_id', user.id)
      .eq('test_date', today)
      .limit(1);

    if (!error && data && data.length > 0) {
      setHasAlreadyTakenTest(true);
    }
  };

  const handleStartTest = (practiceMode = false) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setIsPracticeMode(practiceMode);
    setHasStarted(true);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setSelectedAnswer(null);
    setIsCompleted(false);
    setResult(null);
    setShowExplanation(false);
    setCurrentQuestionResult(null);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const currentQ = testQuestions[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;

    if (isPracticeMode) {
      // In practice mode, show explanation immediately
      setCurrentQuestionResult({
        isCorrect,
        userAnswer: selectedAnswer,
        correctAnswer: currentQ.correctAnswer
      });
      setShowExplanation(true);
      return;
    }

    // Regular test mode - proceed directly
    proceedToNextQuestion();
  };

  const proceedToNextQuestion = () => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = selectedAnswer!;
    setSelectedAnswers(newAnswers);

    if (currentQuestion < testQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setCurrentQuestionResult(null);
    } else {
      completeTest(newAnswers);
    }
  };

  const completeTest = async (answers: number[]) => {
    if (!user) return;

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

    const score = Math.round((correctCount / testQuestions.length) * 100);
    const testResult: TestResult = {
      score,
      totalQuestions: testQuestions.length,
      moduleScores,
      completedAt: new Date().toISOString()
    };

    // Save to database
    const { error } = await supabase
      .from('test_results')
      .insert({
        user_id: user.id,
        score,
        total_questions: testQuestions.length,
        difficulty: userDifficulty,
        module_scores: moduleScores,
        test_date: new Date().toISOString().split('T')[0]
      });

    if (error) {
      console.error('Error saving test result:', error);
      toast.error('Error saving test result');
    } else {
      toast.success(`Test completed! Score: ${score}%`);
    }

    setResult(testResult);
    setIsCompleted(true);
    setHasAlreadyTakenTest(true);

    // Also save to localStorage for backwards compatibility
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
          <p>{t('loading')}...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('authRequired')}</h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t('signInToAccess')}
            </p>
            <Button onClick={() => navigate('/auth')} size="lg">
              {t('signIn')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasStarted && !isCompleted) {
    return (
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="container max-w-6xl mx-auto">
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
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="test">{t('dailyTest')}</TabsTrigger>
              <TabsTrigger value="friends">{t('friends')}</TabsTrigger>
              <TabsTrigger value="rankings">{t('rankings')}</TabsTrigger>
            </TabsList>

            <TabsContent value="test">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dailyFinanceTest')}</CardTitle>
                    <CardDescription>
                      {hasAlreadyTakenTest ? 
                        t('alreadyTakenToday') : 
                        t('readyToStart')
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <Button 
                      onClick={() => handleStartTest(false)} 
                      size="lg"
                      disabled={hasAlreadyTakenTest}
                      className="w-full"
                    >
                      {hasAlreadyTakenTest ? t('completedToday') : t('startDailyTest')}
                    </Button>
                    {hasAlreadyTakenTest && (
                      <p className="text-sm text-muted-foreground">
                        {t('comeBackTomorrow')}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('practiceMode')}</CardTitle>
                    <CardDescription>
                      {t('practiceTestDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button 
                      onClick={() => handleStartTest(true)} 
                      size="lg"
                      variant="outline"
                      className="w-full"
                    >
                      {t('startPracticeTest')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="friends">
              <FriendsPanel />
            </TabsContent>

            <TabsContent value="rankings">
              <Leaderboard />
            </TabsContent>
          </Tabs>
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

          <div className="text-center space-y-4">
            <div className="flex justify-center gap-4">
              <Button onClick={() => setActiveTab('friends')} variant="outline">
                <Users className="w-4 h-4 mr-2" />
                {t('viewFriends')}
              </Button>
              <Button onClick={() => setActiveTab('rankings')} variant="outline">
                <Trophy className="w-4 h-4 mr-2" />
                {t('viewRankings')}
              </Button>
              {result && (
                <Button onClick={() => handleStartTest(true)} variant="outline">
                  <Brain className="w-4 h-4 mr-2" />
                  {t('retakeForLearning')}
                </Button>
              )}
            </div>
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
                <div className="flex gap-2">
                  <Badge variant="outline">{t(userDifficulty)}</Badge>
                  {isPracticeMode && <Badge variant="secondary">{t('practiceMode')}</Badge>}
                </div>
              </div>
              <CardTitle className="text-xl">
                {t(currentQ.questionKey)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQ.options.map((optionKey, index) => {
                let buttonVariant: "default" | "outline" | "destructive" | "secondary" = 
                  selectedAnswer === index ? "default" : "outline";
                
                if (showExplanation && currentQuestionResult) {
                  if (index === currentQuestionResult.correctAnswer) {
                    buttonVariant = "default"; // Correct answer - highlighted
                  } else if (index === currentQuestionResult.userAnswer && !currentQuestionResult.isCorrect) {
                    buttonVariant = "destructive"; // Wrong user answer
                  } else {
                    buttonVariant = "outline";
                  }
                }

                return (
                  <Button
                    key={index}
                    variant={buttonVariant}
                    className="w-full text-left justify-start h-auto py-4 px-4"
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showExplanation}
                  >
                    <div className="flex items-center gap-2">
                      {showExplanation && index === currentQuestionResult?.correctAnswer && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {showExplanation && index === currentQuestionResult?.userAnswer && !currentQuestionResult?.isCorrect && (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>{String.fromCharCode(65 + index)}. {t(optionKey)}</span>
                    </div>
                  </Button>
                );
              })}

              {/* Show explanation in practice mode */}
              {showExplanation && currentQuestionResult && isPracticeMode && (
                <Card className="mt-4 border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      {t('explanation')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {t(currentQ.explanationKey)}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{t('yourAnswer')}:</span>
                        <span className={currentQuestionResult.isCorrect ? "text-green-600" : "text-red-600"}>
                          {String.fromCharCode(65 + currentQuestionResult.userAnswer)}
                        </span>
                        {currentQuestionResult.isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      {!currentQuestionResult.isCorrect && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{t('correctAnswer')}:</span>
                          <span className="text-green-600">
                            {String.fromCharCode(65 + currentQuestionResult.correctAnswer)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (currentQuestion > 0) {
                  setCurrentQuestion(currentQuestion - 1);
                  setSelectedAnswer(selectedAnswers[currentQuestion - 1] || null);
                  setShowExplanation(false);
                  setCurrentQuestionResult(null);
                }
              }}
              disabled={currentQuestion === 0}
            >
              {t('previous')}
            </Button>
            <Button
              onClick={showExplanation ? proceedToNextQuestion : handleNext}
              disabled={selectedAnswer === null && !showExplanation}
            >
              {showExplanation ? 
                (currentQuestion === testQuestions.length - 1 ? t('finishTest') : t('continueToNext')) :
                (currentQuestion === testQuestions.length - 1 ? t('finishTest') : t('next'))
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialDailyTest;