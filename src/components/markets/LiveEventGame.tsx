import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, TrendingUp, TrendingDown, Minus, Zap, Clock, Trophy, Square, Gauge, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  ticker: string;
  class: 'stock' | 'etf' | 'crypto';
  currentPrice: number;
  allocation: number;
  shares: number;
}

interface MarketEvent {
  id: string;
  title: string;
  description: string;
  correctAnswer: 'BUY' | 'SELL' | 'KEEP';
  reasoning: string;
  impact: {
    positive: number;
    negative: number;
  };
}

interface GameState {
  cash: number;
  totalValue: number;
  roundsLeft: number;
  currentEvent: MarketEvent | null;
  assets: Asset[];
  decisions: Array<{
    eventId: string;
    action: 'BUY' | 'SELL' | 'KEEP';
    priceChange: number;
    result: number;
    optimalAction: 'BUY' | 'SELL' | 'KEEP';
    portfolioImpact: number;
  }>;
  usedEventIds: string[];
  gameSpeed: 'slow' | 'normal' | 'fast';
  initialValue: number;
}

const INITIAL_ASSETS: Asset[] = [
  { id: 'STOCKS', name: 'Stock Portfolio', ticker: 'STOCKS', class: 'stock', currentPrice: 100, allocation: 40, shares: 400 },
  { id: 'CRYPTO', name: 'Cryptocurrency', ticker: 'CRYPTO', class: 'crypto', currentPrice: 100, allocation: 20, shares: 200 },
  { id: 'GOLD', name: 'Gold Assets', ticker: 'GOLD', class: 'etf', currentPrice: 100, allocation: 15, shares: 150 },
  { id: 'ENERGY', name: 'Energy Sector', ticker: 'ENERGY', class: 'stock', currentPrice: 100, allocation: 15, shares: 150 },
  { id: 'TECH', name: 'Tech Stocks', ticker: 'TECH', class: 'stock', currentPrice: 100, allocation: 10, shares: 100 }
];

const MARKET_EVENTS: MarketEvent[] = [
  {
    id: '1',
    title: 'Federal Reserve cuts interest rates by 0.5%',
    description: 'The Federal Reserve announces an unexpected rate cut to stimulate economic growth.',
    correctAnswer: 'BUY',
    reasoning: 'Lower rates make borrowing cheaper and often boost stock prices and growth assets.',
    impact: { positive: 0.08, negative: -0.02 }
  },
  {
    id: '2',
    title: 'Federal Reserve raises interest rates by 1%',
    description: 'The Fed increases rates significantly to combat inflation concerns.',
    correctAnswer: 'SELL',
    reasoning: 'Higher rates hurt growth stocks and riskier markets, investors move to safer assets.',
    impact: { positive: -0.06, negative: -0.12 }
  },
  {
    id: '3',
    title: 'Gold prices surge due to geopolitical tensions',
    description: 'International conflicts drive investors to safe haven assets.',
    correctAnswer: 'BUY',
    reasoning: 'Gold acts as a safe haven in uncertainty.',
    impact: { positive: 0.15, negative: -0.03 }
  },
  {
    id: '4',
    title: 'Elon Musk tweets Tesla will launch a robotaxi service',
    description: 'Social media buzz around Tesla\'s autonomous vehicle plans.',
    correctAnswer: 'BUY',
    reasoning: 'Social media hype often drives Tesla\'s price up in the short term.',
    impact: { positive: 0.12, negative: -0.05 }
  },
  {
    id: '5',
    title: 'New tech IPO: "StartAI" launches at high demand',
    description: 'A promising AI startup goes public with massive investor interest.',
    correctAnswer: 'BUY',
    reasoning: 'IPOs can pop on day one; educational moment about speculation.',
    impact: { positive: 0.18, negative: -0.08 }
  },
  {
    id: '6',
    title: 'Cryptocurrency market faces regulatory crackdown',
    description: 'Government announces stricter regulations on digital currencies.',
    correctAnswer: 'SELL',
    reasoning: 'Regulation fear typically makes crypto prices fall fast.',
    impact: { positive: -0.15, negative: -0.25 }
  },
  {
    id: '7',
    title: 'Bitcoin adoption announced by a major Latin American country',
    description: 'A nation declares Bitcoin as legal tender, boosting adoption.',
    correctAnswer: 'BUY',
    reasoning: 'Adoption fuels demand and optimism in crypto markets.',
    impact: { positive: 0.20, negative: -0.05 }
  },
  {
    id: '8',
    title: 'Oil prices spike after OPEC cuts production',
    description: 'Major oil producers reduce supply, driving prices higher.',
    correctAnswer: 'BUY',
    reasoning: 'Energy companies benefit from higher oil prices.',
    impact: { positive: 0.14, negative: -0.04 }
  },
  {
    id: '9',
    title: 'A major bank collapses due to risky lending',
    description: 'Financial institution fails, sparking sector-wide concerns.',
    correctAnswer: 'SELL',
    reasoning: 'Fear spreads in financial sector causing sell-offs.',
    impact: { positive: -0.10, negative: -0.18 }
  },
  {
    id: '10',
    title: 'Tech giant announces record-breaking quarterly earnings',
    description: 'Major technology company exceeds all profit expectations.',
    correctAnswer: 'BUY',
    reasoning: 'Strong earnings drive stock prices higher.',
    impact: { positive: 0.11, negative: -0.03 }
  },
  {
    id: '11',
    title: 'A global pandemic is declared',
    description: 'World Health Organization declares international health emergency.',
    correctAnswer: 'SELL',
    reasoning: 'Historically, stocks dip sharply at onset of crises.',
    impact: { positive: -0.20, negative: -0.30 }
  },
  {
    id: '12',
    title: 'Housing market data shows falling prices and higher mortgage defaults',
    description: 'Real estate sector shows signs of significant distress.',
    correctAnswer: 'SELL',
    reasoning: 'Decline in housing sector affects related stocks and REITs.',
    impact: { positive: -0.08, negative: -0.16 }
  },
  {
    id: '13',
    title: 'Government announces massive infrastructure spending bill',
    description: 'Multi-trillion dollar investment in roads, bridges, and green energy.',
    correctAnswer: 'BUY',
    reasoning: 'Stimulus boosts companies in infrastructure-related sectors.',
    impact: { positive: 0.13, negative: -0.02 }
  },
  {
    id: '14',
    title: 'Social media trend "#DeleteBankAccounts" spreads after scandal',
    description: 'Banking industry faces public backlash over privacy concerns.',
    correctAnswer: 'SELL',
    reasoning: 'Reputation damage leads to stock decline.',
    impact: { positive: -0.07, negative: -0.14 }
  },
  {
    id: '15',
    title: 'AI breakthrough reduces production costs by 50% for manufacturing firms',
    description: 'Revolutionary AI technology transforms industrial efficiency.',
    correctAnswer: 'BUY',
    reasoning: 'Lower costs equal higher profitability and higher stock prices.',
    impact: { positive: 0.16, negative: -0.03 }
  }
];

export const LiveEventGame = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [lastDecision, setLastDecision] = useState<{
    action: 'BUY' | 'SELL' | 'KEEP';
    event: MarketEvent;
    impact: number;
    wasCorrect: boolean;
  } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [gameSpeed, setGameSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [gamePaused, setGamePaused] = useState(false);

  // Trigger first event when game starts
  useEffect(() => {
    if (gameStarted && gameState && !gameState.currentEvent && !showResults && !gamePaused) {
      const timer = setTimeout(() => {
        triggerNextEvent();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, gameState, showResults, gamePaused]);

  // Portfolio price movement over time
  useEffect(() => {
    if (!gameStarted || !gameState || gamePaused || showResults || gameState.currentEvent) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev;
        
        // Small random price movements for each asset
        const updatedAssets = prev.assets.map(asset => ({
          ...asset,
          currentPrice: asset.currentPrice * (1 + (Math.random() - 0.5) * 0.01) // ±0.5% random movement
        }));

        const newTotalValue = updatedAssets.reduce((sum, asset) => sum + (asset.currentPrice * asset.shares), 0) + prev.cash;

        return {
          ...prev,
          assets: updatedAssets,
          totalValue: newTotalValue
        };
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [gameStarted, gameState?.currentEvent, gamePaused, showResults]);

  const startGame = () => {
    const totalValue = INITIAL_ASSETS.reduce((sum, asset) => sum + (asset.currentPrice * asset.shares), 0);
    const initialPortfolioValue = totalValue + 10000;
    
    setGameState({
      cash: 10000,
      totalValue: initialPortfolioValue,
      roundsLeft: 10,
      currentEvent: null,
      assets: [...INITIAL_ASSETS],
      decisions: [],
      usedEventIds: [],
      gameSpeed,
      initialValue: initialPortfolioValue
    });
    setGameStarted(true);
    setGamePaused(false);
  };

  const triggerNextEvent = () => {
    if (!gameState || gamePaused) return;
    
    // Select event ensuring variety - avoid recently used events when possible
    let availableEvents = MARKET_EVENTS.filter(e => !gameState.usedEventIds.includes(e.id));
    if (availableEvents.length === 0) {
      // If all events used, reset but avoid the last 2 events
      const recentEvents = gameState.usedEventIds.slice(-2);
      availableEvents = MARKET_EVENTS.filter(e => !recentEvents.includes(e.id));
    }
    if (availableEvents.length === 0) {
      availableEvents = MARKET_EVENTS; // Fallback
    }
    
    const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    setGameState(prev => prev ? { 
      ...prev, 
      currentEvent: randomEvent,
      usedEventIds: [...prev.usedEventIds, randomEvent.id].slice(-6) // Keep last 6 events
    } : null);
    setShowEventModal(true);
  };

  const makeDecision = (action: 'BUY' | 'SELL' | 'KEEP') => {
    if (!gameState?.currentEvent || gamePaused) return;

    const event = gameState.currentEvent;
    const wasCorrect = action === event.correctAnswer;
    
    // Calculate price impact based on correctness
    const priceChange = wasCorrect ? event.impact.positive : event.impact.negative;
    
    // Calculate portfolio impact (simplified for this demo)
    const portfolioImpact = gameState.totalValue * Math.abs(priceChange);
    const newTotalValue = gameState.totalValue * (1 + priceChange);

    // Record decision
    const newDecision = {
      eventId: event.id,
      action,
      priceChange,
      result: wasCorrect ? 1 : 0,
      optimalAction: event.correctAnswer,
      portfolioImpact
    };

    // Update game state
    setGameState(prev => prev ? {
      ...prev,
      totalValue: newTotalValue,
      roundsLeft: prev.roundsLeft - 1,
      decisions: [...prev.decisions, newDecision],
      currentEvent: null
    } : null);

    // Show impact modal
    setLastDecision({
      action,
      event,
      impact: portfolioImpact * (wasCorrect ? 1 : -1),
      wasCorrect
    });
    
    setShowEventModal(false);
    setShowImpactModal(true);

    // Get delay based on game speed
    const getDelay = () => {
      switch (gameState.gameSpeed) {
        case 'slow': return 4000;
        case 'fast': return 2000;
        default: return 3000;
      }
    };

    // Continue game or end after showing impact
    setTimeout(() => {
      setShowImpactModal(false);
      if (gameState.roundsLeft <= 1) {
        setShowResults(true);
      } else {
        triggerNextEvent();
      }
    }, getDelay());
  };

  const stopGame = () => {
    setShowResults(true);
  };

  const resetGame = () => {
    setGameState(null);
    setGameStarted(false);
    setShowResults(false);
    setShowEventModal(false);
    setShowImpactModal(false);
    setLastDecision(null);
    setGamePaused(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };

  if (!gameStarted || !gameState) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Play className="w-6 h-6 text-primary" />
            Start Live Event Game
          </CardTitle>
          <CardDescription>
            Build your portfolio and make quick decisions as market events unfold in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <h4 className="font-semibold text-primary mb-2">Starting Portfolio</h4>
              <p className="text-sm text-muted-foreground">
                Mix of stocks, ETFs, and crypto worth ~$100K
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-financial mb-2">10+ Market Events</h4>
              <p className="text-sm text-muted-foreground">
                Real scenarios like earnings, Fed decisions, crypto news
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-risk-medium mb-2">Quick Decisions</h4>
              <p className="text-sm text-muted-foreground">
                Choose Buy, Hold, or Sell for each affected asset
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gauge className="w-4 h-4" />
              <span className="text-sm font-medium">Game Speed</span>
            </div>
            <Select value={gameSpeed} onValueChange={(value: 'slow' | 'normal' | 'fast') => setGameSpeed(value)}>
              <SelectTrigger className="w-48 mx-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow (3s between events)</SelectItem>
                <SelectItem value="normal">Normal (2s between events)</SelectItem>
                <SelectItem value="fast">Fast (1s between events)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={startGame} size="lg" className="bg-gradient-hero">
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const goodDecisions = gameState.decisions.filter(d => d.result === 1).length;
    const optimalDecisions = gameState.decisions.filter(d => d.optimalAction).length;
    const totalDecisions = gameState.decisions.length;
    const successRate = (goodDecisions / totalDecisions) * 100;
    const actualReturn = ((gameState.totalValue - gameState.initialValue) / gameState.initialValue) * 100;
    
    // Calculate optimal return if all decisions were perfect
    let optimalValue = gameState.initialValue;
    gameState.decisions.forEach(decision => {
      if (decision.result === 1) {
        optimalValue += Math.abs(decision.portfolioImpact);
      }
    });
    const optimalReturn = ((optimalValue - gameState.initialValue) / gameState.initialValue) * 100;

    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-financial" />
            Game Complete!
          </CardTitle>
          <CardDescription>
            Here's how your decisions impacted your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Final Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-financial">
                  {formatCurrency(gameState.totalValue)}
                </p>
                <p className="text-sm text-muted-foreground">Final Portfolio Value</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${actualReturn >= 0 ? 'text-financial' : 'text-risk-high'}`}>
                  {actualReturn >= 0 ? '+' : ''}{actualReturn.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Your ROI</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  +{optimalReturn.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Optimal ROI</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {goodDecisions}/{totalDecisions}
                </p>
                <p className="text-sm text-muted-foreground">Good Decisions</p>
              </CardContent>
            </Card>
          </div>

          {/* Decision Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Decision Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gameState.decisions.map((decision, index) => {
                  const event = MARKET_EVENTS.find(e => e.id === decision.eventId);
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Action: {decision.action}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${decision.priceChange >= 0 ? 'text-financial' : 'text-risk-high'}`}>
                          {decision.priceChange >= 0 ? '+' : ''}{formatPercentage(decision.priceChange)}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          Optimal: {decision.optimalAction}
                        </div>
                        {decision.result === 1 ? (
                          <TrendingUp className="w-4 h-4 text-financial" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-risk-high" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Learning Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {actualReturn >= optimalReturn * 0.8 && (
                  <p className="text-financial">
                    🎉 Outstanding performance! You achieved {actualReturn.toFixed(1)}% return vs optimal {optimalReturn.toFixed(1)}%. You made {successRate.toFixed(0)}% good decisions.
                  </p>
                )}
                {actualReturn >= optimalReturn * 0.5 && actualReturn < optimalReturn * 0.8 && (
                  <p className="text-risk-medium">
                    📈 Good performance! You achieved {actualReturn.toFixed(1)}% return vs optimal {optimalReturn.toFixed(1)}%. Room to improve decision timing.
                  </p>
                )}
                {actualReturn < optimalReturn * 0.5 && (
                  <p className="text-risk-high">
                    📚 Learning opportunity! You achieved {actualReturn.toFixed(1)}% return vs optimal {optimalReturn.toFixed(1)}%. Focus on the optimal actions shown above.
                  </p>
                )}
                <Separator className="my-3" />
                <p className="text-muted-foreground">
                  <strong>Key Lesson:</strong> Market timing requires understanding event impacts. Buy positive news, sell negative news for affected assets. The optimal ROI shows what was possible with perfect decisions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button onClick={resetGame} variant="outline" className="w-full">
            Play Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold text-financial">
                  {formatCurrency(gameState.totalValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(gameState.cash)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Rounds Left</p>
              <p className="text-2xl font-bold text-primary">{gameState.roundsLeft}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Progress value={((10 - gameState.roundsLeft) / 10) * 100} className="flex-1" />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={stopGame}
              className="text-xs"
            >
              <Square className="w-3 h-3 mr-1" />
              Stop
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Speed: {gameState.gameSpeed} | Click Stop to end early and see results
          </p>
        </CardContent>
      </Card>

      {/* Event Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Market Event
            </DialogTitle>
            <DialogDescription>
              A new market event has occurred. Choose your action wisely!
            </DialogDescription>
          </DialogHeader>
          
          {gameState.currentEvent && (
            <div className="space-y-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{gameState.currentEvent.title}</h3>
                  <p className="text-muted-foreground mb-4">{gameState.currentEvent.description}</p>
                </CardContent>
              </Card>
              
              <div className="text-center">
                <h4 className="font-medium mb-4">What's your decision?</h4>
                <div className="flex gap-3 justify-center">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="min-w-[100px] hover:bg-financial/10 hover:border-financial hover:text-financial"
                    onClick={() => makeDecision('BUY')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    BUY
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="min-w-[100px]"
                    onClick={() => makeDecision('KEEP')}
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    KEEP
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="min-w-[100px] hover:bg-risk-high/10 hover:border-risk-high hover:text-risk-high"
                    onClick={() => makeDecision('SELL')}
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    SELL
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Impact Modal */}
      <Dialog open={showImpactModal} onOpenChange={setShowImpactModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {lastDecision?.wasCorrect ? (
                <CheckCircle className="w-5 h-5 text-financial" />
              ) : (
                <XCircle className="w-5 h-5 text-risk-high" />
              )}
              Decision Impact
            </DialogTitle>
          </DialogHeader>
          
          {lastDecision && (
            <div className="space-y-4">
              <Card className={`${lastDecision.wasCorrect ? 'border-financial/20 bg-financial/5' : 'border-risk-high/20 bg-risk-high/5'}`}>
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-lg mb-2">You chose: {lastDecision.action}</h3>
                    <p className={`text-2xl font-bold ${lastDecision.impact >= 0 ? 'text-financial' : 'text-risk-high'}`}>
                      {lastDecision.impact >= 0 ? '+' : ''}{formatCurrency(lastDecision.impact)}
                    </p>
                    <p className="text-sm text-muted-foreground">Portfolio Impact</p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <p className="font-medium">Correct Answer: {lastDecision.event.correctAnswer}</p>
                    <p className="text-sm text-muted-foreground">{lastDecision.event.reasoning}</p>
                  </div>
                  
                  {lastDecision.wasCorrect ? (
                    <div className="text-center mt-4">
                      <Badge className="bg-financial text-white">Great Decision!</Badge>
                    </div>
                  ) : (
                    <div className="text-center mt-4">
                      <Badge variant="destructive">Better luck next time!</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {gameState.assets.map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{asset.ticker}</span>
                  <span className="text-sm text-muted-foreground">{asset.shares} shares</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(asset.currentPrice * asset.shares)}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(asset.currentPrice)}/share</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};