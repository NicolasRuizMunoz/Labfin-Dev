import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Brain, TrendingUp, Target, Clock, Shield } from 'lucide-react';

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
  const [currentQuestion, setCurrentQuestion] = useState(-1); // Start at -1 for intro
  const [answers, setAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const questions: Question[] = [
    {
      id: 'financialGoal',
      question: 'What is your main financial objective?',
      icon: Target,
      options: [
        { text: 'Preserving capital and steady income', value: 1, category: 'conservative' },
        { text: 'Buying a home or major purchase', value: 2, category: 'moderate' },
        { text: 'Building long-term wealth for retirement', value: 3, category: 'aggressive' },
        { text: 'Generating passive income', value: 2, category: 'moderate' }
      ]
    },
    {
      id: 'timeHorizon',
      question: 'How long are you planning to keep your investments?',
      icon: Clock,
      options: [
        { text: '1-3 years (Short-term)', value: 1, category: 'conservative' },
        { text: '4-7 years (Medium-term)', value: 2, category: 'moderate' },
        { text: '8+ years (Long-term)', value: 3, category: 'aggressive' }
      ]
    },
    {
      id: 'riskTolerance',
      question: 'How would you react if your portfolio dropped 15% in one month?',
      icon: TrendingUp,
      options: [
        { text: 'Sell immediately to avoid further losses', value: 1, category: 'conservative' },
        { text: 'Hold and wait for recovery', value: 2, category: 'moderate' },
        { text: 'Buy more at the lower price', value: 3, category: 'aggressive' }
      ]
    },
    {
      id: 'incomeStability',
      question: 'How stable is your current income?',
      icon: Shield,
      options: [
        { text: 'Very stable (steady job, predictable income)', value: 3, category: 'conservative' },
        { text: 'Somewhat stable (occasional fluctuations)', value: 2, category: 'moderate' },
        { text: 'Unstable (freelance, commission-based)', value: 1, category: 'aggressive' }
      ]
    },
    {
      id: 'assetPreference',
      question: 'Which asset type do you feel most comfortable with?',
      icon: Target,
      options: [
        { text: 'Fixed income (bonds, CDs, savings)', value: 1, category: 'conservative' },
        { text: 'Real estate (rental properties, REITs)', value: 2, category: 'moderate' },
        { text: 'Stocks and ETFs', value: 3, category: 'aggressive' },
        { text: 'Alternative investments (crypto, commodities)', value: 3, category: 'aggressive' }
      ]
    },
    {
      id: 'marketExperience',
      question: 'How much experience do you have with investing?',
      icon: Brain,
      options: [
        { text: 'Beginner (little to no experience)', value: 1, category: 'conservative' },
        { text: 'Intermediate (some experience, basic knowledge)', value: 2, category: 'moderate' },
        { text: 'Advanced (significant experience and knowledge)', value: 3, category: 'aggressive' }
      ]
    },
    {
      id: 'volatilityComfort',
      question: 'How comfortable are you with market volatility?',
      icon: TrendingUp,
      options: [
        { text: 'I prefer stability over potential high returns', value: 1, category: 'conservative' },
        { text: 'I can accept some fluctuations for better returns', value: 2, category: 'moderate' },
        { text: 'I embrace volatility for maximum growth potential', value: 3, category: 'aggressive' }
      ]
    },
    {
      id: 'emergencyFund',
      question: 'Do you have an emergency fund covering 3-6 months of expenses?',
      icon: Shield,
      options: [
        { text: 'Yes, I have a solid emergency fund', value: 3, category: 'aggressive' },
        { text: 'Partially, working on building it', value: 2, category: 'moderate' },
        { text: 'No, I need to build one first', value: 1, category: 'conservative' }
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
        return ['Fixed income bonds', 'High-yield savings', 'Conservative mutual funds', 'Real estate (rental income focus)'];
      case 'Moderate':
        return ['Diversified ETFs', 'Real estate investment', 'Balanced mutual funds', 'Blue-chip stocks'];
      case 'Aggressive':
        return ['Growth stocks', 'Technology ETFs', 'Real estate (appreciation focus)', 'Alternative investments'];
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Assessment Complete!</h1>
            <p className="text-lg text-muted-foreground">
              Great! Now your simulations will be personalized based on your preferences and tolerance for risk.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Your Risk Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge className={`text-lg px-4 py-2 ${getRiskProfileColor(result.riskProfile)}`}>
                    {result.riskProfile}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Score: {result.score}/3.0
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm">Time Horizon:</p>
                    <p className="text-muted-foreground text-sm">{result.timeHorizon}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Primary Goal:</p>
                    <p className="text-muted-foreground text-sm">{result.primaryGoal}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Asset Preference:</p>
                    <p className="text-muted-foreground text-sm">{result.assetPreference}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Recommended Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Based on your {result.riskProfile.toLowerCase()} profile:
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
              Your results have been saved. The AI Finance Coach will use this profile to provide personalized advice.
            </p>
            <Button onClick={resetAssessment} variant="outline">
              Retake Assessment
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Self-Assessment Test</h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              This quick self-assessment will help us understand your goals and risk profile so your simulations fit you better.
            </p>
            <Button onClick={() => setCurrentQuestion(0)} size="lg">
              Start Assessment
            </Button>
          </div>
        )}

        {currentQuestion >= 0 && !isCompleted && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
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
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={selectedAnswer === null}
              >
                {currentQuestion === questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfAssessmentPage;