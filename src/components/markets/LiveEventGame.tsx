import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Play, TrendingUp, TrendingDown, Minus, Zap, Clock, Trophy } from 'lucide-react';

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
  }>;
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

  const startGame = () => {
    const totalValue = INITIAL_ASSETS.reduce((sum, asset) => sum + (asset.currentPrice * asset.shares), 0);
    
    setGameState({
      cash: 10000,
      totalValue: totalValue + 10000,
      roundsLeft: 6,
      currentEvent: null,
      assets: [...INITIAL_ASSETS],
      decisions: []
    });
    setGameStarted(true);
    triggerNextEvent();
  };

  const triggerNextEvent = () => {
    if (!gameState) return;
    
    const randomEvent = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    setGameState(prev => prev ? { ...prev, currentEvent: randomEvent } : null);
    setCurrentDecision(null);
  };

  const makeDecision = (assetId: string, action: 'buy' | 'hold' | 'sell') => {
    if (!gameState?.currentEvent) return;

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
      result
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

    // Continue game or end
    if (gameState.roundsLeft <= 1) {
      setTimeout(() => setShowResults(true), 2000);
    } else {
      setTimeout(() => triggerNextEvent(), 2000);
    }
  };

  const resetGame = () => {
    setGameState(null);
    setGameStarted(false);
    setShowResults(false);
    setCurrentDecision(null);
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
              <h4 className="font-semibold text-financial mb-2">6 Market Events</h4>
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
    const totalDecisions = gameState.decisions.length;
    const successRate = (goodDecisions / totalDecisions) * 100;
    const initialValue = 110000; // Approximate initial portfolio value
    const totalReturn = ((gameState.totalValue - initialValue) / initialValue) * 100;

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
          <div className="grid grid-cols-3 gap-4">
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
                <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-financial' : 'text-risk-high'}`}>
                  {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Total Return</p>
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
                {successRate >= 70 && (
                  <p className="text-financial">
                    🎉 Excellent performance! You made {successRate.toFixed(0)}% good decisions. You understand how to react to market events.
                  </p>
                )}
                {successRate >= 40 && successRate < 70 && (
                  <p className="text-risk-medium">
                    📈 Good job! You made {successRate.toFixed(0)}% good decisions. Practice recognizing which events favor buying vs selling.
                  </p>
                )}
                {successRate < 40 && (
                  <p className="text-risk-high">
                    📚 Learning opportunity! You made {successRate.toFixed(0)}% good decisions. Remember: buy good news, sell bad news for affected assets.
                  </p>
                )}
                <Separator className="my-3" />
                <p className="text-muted-foreground">
                  <strong>Key Lesson:</strong> Market timing is difficult, but understanding how events affect different assets helps make better decisions. Diversification and dollar-cost averaging often beat trying to time the market perfectly.
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
          <Progress value={((6 - gameState.roundsLeft) / 6) * 100} className="w-full" />
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