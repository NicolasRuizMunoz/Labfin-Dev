import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, TrendingUp, TrendingDown, Minus, Zap, Clock, Trophy, Square, Gauge } from 'lucide-react';

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
  affects: string[];
  impact: {
    min: number;
    max: number;
  };
  duration: number;
}

interface GameState {
  cash: number;
  totalValue: number;
  roundsLeft: number;
  currentEvent: MarketEvent | null;
  assets: Asset[];
  decisions: Array<{
    eventId: string;
    assetId: string;
    action: 'buy' | 'hold' | 'sell';
    priceChange: number;
    result: number;
    optimalAction: 'buy' | 'hold' | 'sell';
  }>;
  usedEventIds: string[];
  gameSpeed: 'slow' | 'normal' | 'fast';
  initialValue: number;
}

const INITIAL_ASSETS: Asset[] = [
  { id: 'TSLA', name: 'Tesla Inc.', ticker: 'TSLA', class: 'stock', currentPrice: 250, allocation: 20, shares: 8 },
  { id: 'AAPL', name: 'Apple Inc.', ticker: 'AAPL', class: 'stock', currentPrice: 180, allocation: 25, shares: 14 },
  { id: 'SPY', name: 'S&P 500 ETF', ticker: 'SPY', class: 'etf', currentPrice: 450, allocation: 30, shares: 7 },
  { id: 'BTC', name: 'Bitcoin', ticker: 'BTC', class: 'crypto', currentPrice: 45000, allocation: 15, shares: 0.033 },
  { id: 'ETH', name: 'Ethereum', ticker: 'ETH', class: 'crypto', currentPrice: 2800, allocation: 10, shares: 0.36 }
];

const MARKET_EVENTS: MarketEvent[] = [
  {
    id: '1',
    title: 'Elon Musk Tweet Impact',
    description: 'Elon Musk tweets about Tesla\'s new breakthrough in battery technology.',
    affects: ['TSLA'],
    impact: { min: 0.05, max: 0.15 },
    duration: 1
  },
  {
    id: '2',
    title: 'Fed Rate Decision',
    description: 'Federal Reserve announces unexpected interest rate cut to stimulate economy.',
    affects: ['SPY', 'AAPL', 'TSLA'],
    impact: { min: 0.02, max: 0.08 },
    duration: 1
  },
  {
    id: '3',
    title: 'Crypto Regulation News',
    description: 'Major country announces favorable cryptocurrency regulation framework.',
    affects: ['BTC', 'ETH'],
    impact: { min: 0.08, max: 0.20 },
    duration: 1
  },
  {
    id: '4',
    title: 'Tech Earnings Surprise',
    description: 'Apple reports better than expected earnings with strong iPhone sales.',
    affects: ['AAPL', 'SPY'],
    impact: { min: 0.03, max: 0.12 },
    duration: 1
  },
  {
    id: '5',
    title: 'Oil Price Shock',
    description: 'Geopolitical tensions cause oil prices to spike, affecting energy and transport sectors.',
    affects: ['TSLA', 'SPY'],
    impact: { min: -0.10, max: -0.03 },
    duration: 1
  },
  {
    id: '6',
    title: 'Market Correction',
    description: 'Broad market selloff as investors take profits after recent gains.',
    affects: ['SPY', 'AAPL', 'TSLA'],
    impact: { min: -0.08, max: -0.02 },
    duration: 1
  },
  {
    id: '7',
    title: 'AI Breakthrough',
    description: 'Major tech companies announce breakthrough in artificial intelligence capabilities.',
    affects: ['AAPL', 'TSLA'],
    impact: { min: 0.06, max: 0.14 },
    duration: 1
  },
  {
    id: '8',
    title: 'China Trade Deal',
    description: 'Unexpected positive development in US-China trade negotiations.',
    affects: ['AAPL', 'SPY'],
    impact: { min: 0.04, max: 0.10 },
    duration: 1
  },
  {
    id: '9',
    title: 'Crypto Exchange Hack',
    description: 'Major cryptocurrency exchange reports security breach, market confidence shaken.',
    affects: ['BTC', 'ETH'],
    impact: { min: -0.15, max: -0.05 },
    duration: 1
  },
  {
    id: '10',
    title: 'Green Energy Initiative',
    description: 'Government announces massive green energy investment program.',
    affects: ['TSLA'],
    impact: { min: 0.08, max: 0.18 },
    duration: 1
  },
  {
    id: '11',
    title: 'Banking Crisis Fear',
    description: 'Regional bank failures spark concerns about financial sector stability.',
    affects: ['SPY', 'AAPL', 'TSLA'],
    impact: { min: -0.12, max: -0.04 },
    duration: 1
  },
  {
    id: '12',
    title: 'Crypto ETF Approval',
    description: 'SEC approves first Bitcoin ETF, institutional adoption accelerates.',
    affects: ['BTC', 'ETH'],
    impact: { min: 0.10, max: 0.25 },
    duration: 1
  }
];

export const LiveEventGame = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentDecision, setCurrentDecision] = useState<{
    assetId: string;
    action: 'buy' | 'hold' | 'sell';
  } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [gameSpeed, setGameSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [gamePaused, setGamePaused] = useState(false);

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
    triggerNextEvent();
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
    setCurrentDecision(null);
  };

  const makeDecision = (assetId: string, action: 'buy' | 'hold' | 'sell') => {
    if (!gameState?.currentEvent || gamePaused) return;

    const event = gameState.currentEvent;
    const asset = gameState.assets.find(a => a.id === assetId);
    if (!asset) return;

    // Calculate price impact
    const isAffected = event.affects.includes(assetId);
    const baseImpact = isAffected 
      ? event.impact.min + Math.random() * (event.impact.max - event.impact.min)
      : (Math.random() - 0.5) * 0.02; // Small random movement for unaffected assets

    let result = 0;
    const priceChange = baseImpact;
    const newPrice = asset.currentPrice * (1 + priceChange);

    // Determine optimal action
    let optimalAction: 'buy' | 'hold' | 'sell';
    if (priceChange > 0.03) {
      optimalAction = 'buy';
    } else if (priceChange < -0.03) {
      optimalAction = 'sell';
    } else {
      optimalAction = 'hold';
    }

    // Calculate decision result
    if (action === 'buy' && priceChange > 0) {
      result = 1; // Good decision
    } else if (action === 'sell' && priceChange < 0) {
      result = 1; // Good decision
    } else if (action === 'hold') {
      result = 0.5; // Neutral
    } else {
      result = 0; // Poor decision
    }

    // Update asset price
    const updatedAssets = gameState.assets.map(a => 
      a.id === assetId ? { ...a, currentPrice: newPrice } : a
    );

    // Record decision
    const newDecision = {
      eventId: event.id,
      assetId,
      action,
      priceChange,
      result,
      optimalAction
    };

    // Update game state
    const newTotalValue = updatedAssets.reduce((sum, asset) => sum + (asset.currentPrice * asset.shares), 0) + gameState.cash;
    
    setGameState(prev => prev ? {
      ...prev,
      assets: updatedAssets,
      totalValue: newTotalValue,
      roundsLeft: prev.roundsLeft - 1,
      decisions: [...prev.decisions, newDecision],
      currentEvent: null
    } : null);

    setCurrentDecision({ assetId, action });

    // Get delay based on game speed
    const getDelay = () => {
      switch (gameState.gameSpeed) {
        case 'slow': return 3000;
        case 'fast': return 1000;
        default: return 2000;
      }
    };

    // Continue game or end
    if (gameState.roundsLeft <= 1) {
      setTimeout(() => setShowResults(true), getDelay());
    } else {
      setTimeout(() => triggerNextEvent(), getDelay());
    }
  };

  const stopGame = () => {
    setShowResults(true);
  };

  const resetGame = () => {
    setGameState(null);
    setGameStarted(false);
    setShowResults(false);
    setCurrentDecision(null);
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
      const asset = gameState.assets.find(a => a.id === decision.assetId);
      if (asset && decision.optimalAction === 'buy' && decision.priceChange > 0) {
        optimalValue += Math.abs(decision.priceChange) * asset.currentPrice * asset.shares;
      } else if (asset && decision.optimalAction === 'sell' && decision.priceChange < 0) {
        optimalValue += Math.abs(decision.priceChange) * asset.currentPrice * asset.shares;
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
                  const asset = gameState.assets.find(a => a.id === decision.assetId);
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset?.ticker}: {decision.action.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${decision.priceChange >= 0 ? 'text-financial' : 'text-risk-high'}`}>
                          {decision.priceChange >= 0 ? '+' : ''}{formatPercentage(decision.priceChange)}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          Optimal: {decision.optimalAction.toUpperCase()}
                        </div>
                        {decision.result === 1 ? (
                          <TrendingUp className="w-4 h-4 text-financial" />
                        ) : decision.result === 0.5 ? (
                          <Minus className="w-4 h-4 text-risk-medium" />
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

      {/* Current Event */}
      {gameState.currentEvent && (
        <Card className="border-primary/30 bg-gradient-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{gameState.currentEvent.title}</CardTitle>
            </div>
            <CardDescription>{gameState.currentEvent.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Affected assets: {gameState.currentEvent.affects.join(', ')}
            </p>
            <div className="grid gap-3">
              {gameState.assets
                .filter(asset => gameState.currentEvent?.affects.includes(asset.id))
                .map(asset => (
                  <Card key={asset.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{asset.ticker}</p>
                          <p className="text-sm text-muted-foreground">{asset.name}</p>
                          <p className="text-sm">
                            Current: {formatCurrency(asset.currentPrice)} 
                            <span className="text-muted-foreground ml-2">
                              ({asset.shares} shares)
                            </span>
                          </p>
                        </div>
                        <Badge variant="outline" className={
                          asset.class === 'stock' ? 'border-primary text-primary' :
                          asset.class === 'etf' ? 'border-financial text-financial' :
                          'border-risk-high text-risk-high'
                        }>
                          {asset.class.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {currentDecision?.assetId === asset.id ? (
                        <div className="text-center">
                          <Badge variant="secondary" className="mb-2">
                            Decision: {currentDecision.action.toUpperCase()}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Processing...
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 hover:bg-financial/10 hover:border-financial hover:text-financial"
                            onClick={() => makeDecision(asset.id, 'buy')}
                          >
                            Buy
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={() => makeDecision(asset.id, 'hold')}
                          >
                            Hold
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 hover:bg-risk-high/10 hover:border-risk-high hover:text-risk-high"
                            onClick={() => makeDecision(asset.id, 'sell')}
                          >
                            Sell
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

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