import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Brain, TrendingUp, Target, Clock, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Question {
  id: string;
  question: string;
  options: {
    text: string;
    value: number;
    category: 'conservative' | 'moderate' | 'aggressive';
  }[];
  icon: any;
}

interface AssessmentResult {
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
  timeHorizon: string;
  primaryGoal: string;
  assetPreference: string;
  incomeStability: string;
  score: number;
  completedAt: string;
}

const SelfAssessmentPage = () => {
  const { t } = useLanguage();
  const [currentQuestion, setCurrentQuestion] = useState(-1); // Start at -1 for intro
  const [answers, setAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const questions: Question[] = [
    {
      id: 'financialGoal',
      question: t('financialGoalQuestion'),
      icon: Target,
      options: [
        { text: t('preservingCapital'), value: 1, category: 'conservative' },
        { text: t('buyingHome'), value: 2, category: 'moderate' },
        { text: t('buildingWealth'), value: 3, category: 'aggressive' },
        { text: t('passiveIncome'), value: 2, category: 'moderate' }
      ]
    },
    {
      id: 'timeHorizon',
      question: t('timeHorizonQuestion'),
      icon: Clock,
      options: [
        { text: t('shortTerm'), value: 1, category: 'conservative' },
        { text: t('mediumTerm'), value: 2, category: 'moderate' },
        { text: t('longTerm'), value: 3, category: 'aggressive' }
      ]
    },
    {
      id: 'riskTolerance',
      question: t('riskToleranceQuestion'),
      icon: TrendingUp,
      options: [
        { text: t('sellImmediately'), value: 1, category: 'conservative' },
        { text: t('holdAndWait'), value: 2, category: 'moderate' },
        { text: t('buyMore'), value: 3, category: 'aggressive' }
      ]
    },
    {
      id: 'incomeStability',
      question: t('incomeStabilityQuestion'),
      icon: Shield,
      options: [
        { text: t('veryStable'), value: 3, category: 'conservative' },
        { text: t('somewhatStable'), value: 2, category: 'moderate' },
        { text: t('unstable'), value: 1, category: 'aggressive' }
      ]
    },
    {
      id: 'assetPreference',
      question: t('assetPreferenceQuestion'),
      icon: Target,
      options: [
        { text: t('assetFixedIncome'), value: 1, category: 'conservative' },
        { text: t('assetRealEstate'), value: 2, category: 'moderate' },
        { text: t('assetStocksETFs'), value: 3, category: 'aggressive' },
        { text: t('assetAlternative'), value: 3, category: 'aggressive' }
      ]
    },
    {
      id: 'marketExperience',
      question: t('marketExperienceQuestion'),
      icon: Brain,
      options: [
        { text: t('experienceBeginner'), value: 1, category: 'conservative' },
        { text: t('experienceIntermediate'), value: 2, category: 'moderate' },
        { text: t('experienceAdvanced'), value: 3, category: 'aggressive' }
      ]
    },
    {
      id: 'volatilityComfort',
      question: t('volatilityComfortQuestion'),
      icon: TrendingUp,
      options: [
        { text: t('preferStability'), value: 1, category: 'conservative' },
        { text: t('acceptFluctuations'), value: 2, category: 'moderate' },
        { text: t('embraceVolatility'), value: 3, category: 'aggressive' }
      ]
    },
    {
      id: 'emergencyFund',
      question: t('emergencyFundQuestion'),
      icon: Shield,
      options: [
        { text: t('solidFund'), value: 3, category: 'aggressive' },
        { text: t('partiallyBuilding'), value: 2, category: 'moderate' },
        { text: t('needToBuild'), value: 1, category: 'conservative' }
      ]
    }
  ];

  const calculateResult = (): AssessmentResult => {
    const totalScore = answers.reduce((sum, answer) => sum + answer, 0);
    const averageScore = totalScore / answers.length;
    
    let riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
    if (averageScore <= 1.5) {
      riskProfile = 'Conservative';
    } else if (averageScore <= 2.3) {
      riskProfile = 'Moderate';
    } else {
      riskProfile = 'Aggressive';
    }

    // Extract specific answers for personalization
    const goalAnswer = questions[0].options[answers[0] - 1]?.text || 'Not specified';
    const timeHorizonAnswer = questions[1].options[answers[1] - 1]?.text || 'Not specified';
    const assetAnswer = questions[4].options[answers[4] - 1]?.text || 'Not specified';
    const incomeAnswer = questions[3].options[answers[3] - 1]?.text || 'Not specified';

    return {
      riskProfile,
      timeHorizon: timeHorizonAnswer,
      primaryGoal: goalAnswer,
      assetPreference: assetAnswer,
      incomeStability: incomeAnswer,
      score: Math.round(averageScore * 100) / 100,
      completedAt: new Date().toISOString()
    };
  };

  const handleAnswerSelect = (answerIndex: number, value: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = [...answers];
    const questionOptions = questions[currentQuestion].options;
    newAnswers[currentQuestion] = questionOptions[selectedAnswer].value;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      // Complete assessment
      const assessmentResult = calculateResult();
      setResult(assessmentResult);
      setIsCompleted(true);
      
      // Store result in localStorage for AI Coach access
      localStorage.setItem('userAssessment', JSON.stringify(assessmentResult));
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(null);
    }
  };

  const resetAssessment = () => {
    setCurrentQuestion(-1);
    setAnswers([]);
    setIsCompleted(false);
    setResult(null);
    setSelectedAnswer(null);
  };

  const getRiskProfileColor = (profile: string) => {
    switch (profile) {
      case 'Conservative':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Aggressive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAssetRecommendations = (profile: string) => {
    switch (profile) {
      case 'Conservative':
        return [t('fixedIncomeBonds'), t('highYieldSavings'), t('conservativeMutualFunds'), t('rentalIncomeFocus')];
      case 'Moderate':
        return [t('diversifiedETFs'), t('realEstateInvestment'), t('balancedMutualFunds'), t('blueChipStocks')];
      case 'Aggressive':
        return [t('growthStocks'), t('technologyETFs'), t('appreciationFocus'), t('alternativeInvestments')];
      default:
        return [];
    }
  };

  if (isCompleted && result) {
    return (
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('assessmentComplete')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('assessmentCompleteDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  {t('yourRiskProfile')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge className={`text-lg px-4 py-2 ${getRiskProfileColor(result.riskProfile)}`}>
                    {t(result.riskProfile.toLowerCase() as 'conservative' | 'moderate' | 'aggressive')}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('score')} {result.score}/3.0
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm">{t('timeHorizon')}</p>
                    <p className="text-muted-foreground text-sm">{result.timeHorizon}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t('primaryGoal')}</p>
                    <p className="text-muted-foreground text-sm">{result.primaryGoal}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t('assetPreference')}</p>
                    <p className="text-muted-foreground text-sm">{result.assetPreference}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {t('recommendedAssets')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('basedOnProfile').replace('{{profile}}', t(result.riskProfile.toLowerCase() as 'conservative' | 'moderate' | 'aggressive'))}
                </p>
                <div className="space-y-2">
                  {getAssetRecommendations(result.riskProfile).map((asset, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      {asset}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">
              {t('resultsLaved')}
            </p>
            <Button onClick={resetAssessment} variant="outline">
              {t('retakeAssessment')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="container max-w-3xl mx-auto">
        {currentQuestion === -1 && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('selfAssessmentTitle')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('assessmentDescription')}
            </p>
            <Button onClick={() => setCurrentQuestion(0)} size="lg">
              {t('startAssessment')}
            </Button>
          </div>
        )}

        {currentQuestion >= 0 && !isCompleted && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('questionProgress').replace('{{current}}', (currentQuestion + 1).toString()).replace('{{total}}', questions.length.toString())}</span>
                <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
              </div>
              <Progress value={((currentQuestion + 1) / questions.length) * 100} />
            </div>

            {/* Question Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  {React.createElement(questions[currentQuestion].icon, {
                    className: "w-6 h-6 text-primary"
                  })}
                  {questions[currentQuestion].question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <Button
                    key={index}
                    variant={selectedAnswer === index ? "default" : "outline"}
                    className="w-full text-left justify-start h-auto py-4 px-4"
                    onClick={() => handleAnswerSelect(index, option.value)}
                  >
                    {option.text}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentQuestion === 0}
              >
                {t('backButton')}
              </Button>
              <Button
                onClick={handleNext}
                disabled={selectedAnswer === null}
              >
                {currentQuestion === questions.length - 1 ? t('completeAssessment') : t('nextQuestion')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfAssessmentPage;