import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Home, CreditCard, PiggyBank, MessageCircle, BookOpen, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { AICoach } from '@/components/AICoach';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [showAICoach, setShowAICoach] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<string | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const tutorialContent = {
    markets: {
      title: "Investment Tutorial",
      description: "Learn about investment fundamentals and portfolio growth",
      content: [
        {
          title: "What Are Investments?",
          text: "Investments grow with contributions and time. They help build wealth through compound growth, where your money earns returns, and those returns earn more returns over time."
        },
        {
          title: "Key Inputs",
          text: "Initial investment: Your starting amount. Monthly contributions: Regular additions to your portfolio. Timeline: How long you'll invest. Risk profile: Your comfort with market ups and downs affects potential returns."
        },
        {
          title: "Understanding Outputs",
          text: "Expected return: Average annual growth rate. Volatility: How much your portfolio value may fluctuate. Portfolio growth: Visual representation of how your money grows over time with compound interest."
        },
        {
          title: "Practical Tip",
          text: "Consistency matters more than timing—watch compounding in action. Even small monthly contributions can grow significantly over decades due to the power of compound interest."
        }
      ],
      quiz: [
        {
          question: "What is diversification in investing?",
          options: [
            "Putting all money in one stock",
            "Spreading investments across different assets to reduce risk",
            "Only investing in cryptocurrency",
            "Avoiding all investments"
          ],
          correct: 1
        },
        {
          question: "What typically happens to risk and return?",
          options: [
            "Higher risk usually means lower returns",
            "Higher risk usually means higher potential returns",
            "Risk and return are unrelated",
            "Lower risk always guarantees higher returns"
          ],
          correct: 1
        },
        {
          question: "What is an ETF?",
          options: [
            "A single company stock",
            "A savings account",
            "A basket of stocks that tracks an index",
            "A type of cryptocurrency"
          ],
          correct: 2
        }
      ]
    },
    realestate: {
      title: "Real Estate Tutorial", 
      description: "Understand mortgages and rental property investments",
      content: [
        {
          title: "Mortgage Basics",
          text: "A mortgage lets you buy a property with a loan. You pay back the loan over time with interest. It's how most people afford homes without paying the full price upfront."
        },
        {
          title: "Key Inputs", 
          text: "Property price: Total cost of the home. Down payment: Upfront cash you pay (typically 3-20%). Interest rate: Annual cost of borrowing. Loan term: How long you'll pay (usually 15-30 years)."
        },
        {
          title: "Understanding Outputs",
          text: "Monthly payment: Your regular payment amount. Total interest: What you'll pay in interest over the life of the loan. Total paid: Complete amount including principal and interest. Watch how these change with different inputs."
        },
        {
          title: "Practical Tip & Rental Properties", 
          text: "Mortgage tip: A higher down payment lowers long-term costs. For rentals: Focus on cash flow (rent minus expenses) and appreciation. Cap rate measures annual return - higher is generally better. Keep expenses realistic for accurate projections."
        }
      ],
      quiz: [
        {
          question: "What does PITI stand for in mortgage payments?",
          options: [
            "Price, Interest, Tax, Insurance",
            "Principal, Interest, Taxes, Insurance",
            "Property, Income, Tax, Investment",
            "Payment, Interest, Total, Insurance"
          ],
          correct: 1
        },
        {
          question: "What is a cap rate in real estate?",
          options: [
            "The maximum interest rate allowed",
            "Annual return on investment as a percentage",
            "The down payment percentage",
            "Monthly rental income"
          ],
          correct: 1
        },
        {
          question: "What affects real estate investment success?",
          options: [
            "Only the purchase price",
            "Only the rental income",
            "Location, condition, and rental demand",
            "Only the mortgage rate"
          ],
          correct: 2
        }
      ]
    },
    credit: {
      title: "Loan Tutorial",
      description: "Master loans and debt management fundamentals", 
      content: [
        {
          title: "What Are Loans?",
          text: "Loans cover needs like cars, education, or debt consolidation. You borrow money and pay it back over time with interest. Different loan types have different terms and rates."
        },
        {
          title: "Key Inputs",
          text: "Amount: How much you need to borrow. Rate: Annual interest percentage - your cost of borrowing. Term: How long you'll take to pay it back (months or years). These three factors determine your payment."
        },
        {
          title: "Understanding Outputs",
          text: "Monthly payment: Fixed amount you'll pay each month. Total interest: Extra cost beyond what you borrowed. Payoff date: When you'll be debt-free. See how different terms affect your total cost."
        },
        {
          title: "Practical Tip",
          text: "Even small extra payments reduce interest dramatically. Try adjusting the simulator - paying just $50 extra monthly on a loan can save thousands in interest and years of payments. The earlier you pay extra, the more you save."
        }
      ],
      quiz: [
        {
          question: "What most affects your credit score?",
          options: [
            "Your income level",
            "Payment history",
            "Age",
            "Bank account balance"
          ],
          correct: 1
        },
        {
          question: "In loan amortization, early payments are mostly:",
          options: [
            "Principal",
            "Interest",
            "Fees",
            "Insurance"
          ],
          correct: 1
        },
        {
          question: "What is the credit score range?",
          options: [
            "0-100",
            "300-850",
            "1-10",
            "0-1000"
          ],
          correct: 1
        }
      ]
    },
    retirement: {
      title: "Retirement Planning Tutorial",
      description: "Learn about long-term financial planning for retirement",
      content: [
        {
          title: "Retirement Planning (Coming Soon)",
          text: "This tool is under development, but soon you'll be able to plan for retirement by combining assets and long-term projections. Retirement planning involves estimating future needs and building a strategy to meet them."
        },
        {
          title: "Why Plan Early?",
          text: "Think of retirement as the end-goal of your financial journey. The earlier you start, the more time compound interest has to work for you. Even small amounts saved consistently can grow to substantial sums over decades."
        },
        {
          title: "Key Concepts",
          text: "Retirement accounts (401k, IRA): Tax-advantaged savings. Asset allocation: Balancing stocks, bonds, and other investments. Withdrawal rate: How much you can safely take out annually (typically 3-4% of your portfolio)."
        },
        {
          title: "Stay Tuned",
          text: "Our comprehensive retirement simulator will help you model different scenarios, account types, and withdrawal strategies. For now, use our investment simulator to see how consistent contributions grow over time."
        }
      ],
      quiz: [
        {
          question: "What is compound interest?",
          options: [
            "Interest paid only on principal",
            "Interest earned on both principal and previous interest",
            "A type of bank account",
            "A retirement penalty"
          ],
          correct: 1
        },
        {
          question: "What percentage of pre-retirement income should you aim to replace?",
          options: [
            "30-40%",
            "50-60%",
            "70-90%",
            "100-120%"
          ],
          correct: 2
        },
        {
          question: "What's a key advantage of starting retirement savings early?",
          options: [
            "Higher interest rates",
            "More time for compound growth",
            "Lower taxes",
            "Guaranteed returns"
          ],
          correct: 1
        }
      ]
    }
  };

  const getTutorialKey = (featureTitle: string) => {
    const titleMap = {
      "Markets Simulator": "markets",
      "Real Estate": "realestate", 
      "Credit & Loans": "credit",
      "Retirement Planning": "retirement"
    };
    return titleMap[featureTitle as keyof typeof titleMap];
  };

  const openTutorial = (type: string) => {
    setCurrentTutorial(type);
    setTutorialOpen(true);
    setQuizStep(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  const closeTutorial = () => {
    setTutorialOpen(false);
    setCurrentTutorial(null);
    setQuizStep(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  const handleQuizAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[quizStep] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuizStep = () => {
    if (currentTutorial && quizStep < tutorialContent[currentTutorial as keyof typeof tutorialContent].quiz.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      setShowResults(true);
    }
  };

  const getQuizScore = () => {
    if (!currentTutorial) return 0;
    const quiz = tutorialContent[currentTutorial as keyof typeof tutorialContent].quiz;
    let correct = 0;
    selectedAnswers.forEach((answer, index) => {
      if (answer === quiz[index]?.correct) correct++;
    });
    return Math.round((correct / quiz.length) * 100);
  };

  const features = [
    {
      title: "Markets Simulator",
      description: "Practice investing in stocks, ETFs, mutual funds, and crypto with realistic market scenarios",
      icon: TrendingUp,
      href: "/markets",
      risk: "Variable",
      riskColor: "risk-medium"
    },
    {
      title: "Real Estate",
      description: "Explore mortgage calculations and rental property investment scenarios",
      icon: Home,
      href: "/real-estate",
      risk: "Medium",
      riskColor: "risk-medium"
    },
    {
      title: "Credit & Loans",
      description: "Understand loan amortization, interest calculations, and payment strategies",
      icon: CreditCard,
      href: "/credit",
      risk: "Low",
      riskColor: "risk-low"
    },
    {
      title: "Retirement Planning",
      description: "Comprehensive retirement planning tools and calculators",
      icon: PiggyBank,
      href: "/retirement",
      risk: "Coming Soon",
      riskColor: "muted",
      disabled: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 px-6">
        <div className="container max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
            Master Finance with 
            <span className="block bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
              LabFin Simulations
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            Master personal finance through interactive simulations. Practice investing, real estate, credit management, and retirement planning in a risk-free environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30"
              onClick={() => setShowAICoach(true)}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start with AI Coach
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              asChild
            >
              <Link to="/markets">Explore Markets</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Four Learning Modules
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each module provides hands-on experience with real financial scenarios and educational feedback
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="group hover:shadow-elevated transition-all duration-300 bg-gradient-card border-0">
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`
                          ${feature.riskColor === 'risk-low' ? 'border-risk-low text-risk-low' : ''}
                          ${feature.riskColor === 'risk-medium' ? 'border-risk-medium text-risk-medium' : ''}
                          ${feature.riskColor === 'risk-high' ? 'border-risk-high text-risk-high' : ''}
                          ${feature.riskColor === 'muted' ? 'border-muted-foreground text-muted-foreground' : ''}
                        `}
                      >
                        {feature.risk}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="mt-2 text-muted-foreground">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
                      asChild={!feature.disabled}
                      disabled={feature.disabled}
                    >
                      {feature.disabled ? (
                        <span>Coming Soon</span>
                      ) : (
                        <Link to={feature.href}>
                          Get Started
                        </Link>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground hover:text-primary"
                      onClick={() => openTutorial(getTutorialKey(feature.title) || '')}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Tutorial
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tutorial Modal */}
      <Dialog open={tutorialOpen} onOpenChange={closeTutorial}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {currentTutorial && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {tutorialContent[currentTutorial as keyof typeof tutorialContent].title}
                </DialogTitle>
                <DialogDescription>
                  {tutorialContent[currentTutorial as keyof typeof tutorialContent].description}
                </DialogDescription>
              </DialogHeader>

              {!showResults ? (
                <div className="space-y-6">
                  {/* Learning Content */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Learning Materials</h3>
                    {tutorialContent[currentTutorial as keyof typeof tutorialContent].content.map((section, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{section.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{section.text}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Separator />

                  {/* Quiz Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Knowledge Test</h3>
                      <div className="text-sm text-muted-foreground">
                        Question {quizStep + 1} of {tutorialContent[currentTutorial as keyof typeof tutorialContent].quiz.length}
                      </div>
                    </div>
                    
                    <Progress 
                      value={(quizStep / tutorialContent[currentTutorial as keyof typeof tutorialContent].quiz.length) * 100} 
                      className="h-2"
                    />

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {tutorialContent[currentTutorial as keyof typeof tutorialContent].quiz[quizStep]?.question}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {tutorialContent[currentTutorial as keyof typeof tutorialContent].quiz[quizStep]?.options.map((option, index) => (
                          <Button
                            key={index}
                            variant={selectedAnswers[quizStep] === index ? "default" : "outline"}
                            className="w-full justify-start text-left h-auto p-4"
                            onClick={() => handleQuizAnswer(index)}
                          >
                            {option}
                          </Button>
                        ))}
                        
                        {selectedAnswers[quizStep] !== undefined && (
                          <Button 
                            onClick={nextQuizStep}
                            className="w-full mt-4"
                          >
                            {quizStep < tutorialContent[currentTutorial as keyof typeof tutorialContent].quiz.length - 1 ? (
                              <>Next Question <ArrowRight className="w-4 h-4 ml-2" /></>
                            ) : (
                              <>See Results <CheckCircle className="w-4 h-4 ml-2" /></>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                /* Results */
                <div className="space-y-6 text-center">
                  <div className="space-y-4">
                    <div className="text-6xl">
                      {getQuizScore() >= 80 ? '🎉' : getQuizScore() >= 60 ? '👍' : '📚'}
                    </div>
                    <h3 className="text-2xl font-bold">
                      Quiz Complete!
                    </h3>
                    <p className="text-lg">
                      You scored {getQuizScore()}% on the {tutorialContent[currentTutorial as keyof typeof tutorialContent].title}
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {tutorialContent[currentTutorial as keyof typeof tutorialContent].quiz.map((question, index) => {
                          const isCorrect = selectedAnswers[index] === question.correct;
                          return (
                            <div key={index} className="flex items-start gap-3 text-left">
                              {isCorrect ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                              )}
                              <div>
                                <p className="font-medium">{question.question}</p>
                                <p className="text-sm text-muted-foreground">
                                  Your answer: {question.options[selectedAnswers[index]]}
                                  {!isCorrect && (
                                    <span className="block text-green-600">
                                      Correct: {question.options[question.correct]}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-4 justify-center">
                    <Button onClick={closeTutorial}>
                      Close Tutorial
                    </Button>
                    {currentTutorial !== 'retirement' && (
                      <Button variant="outline" asChild>
                        <Link to={`/${currentTutorial === 'marketsimulator' ? 'markets' : currentTutorial === 'realestate' ? 'real-estate' : currentTutorial}`}>
                          Try the Simulator
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Coach Modal */}
      {showAICoach && (
        <AICoach 
          isOpen={showAICoach}
          onClose={() => setShowAICoach(false)}
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

export default HomePage;