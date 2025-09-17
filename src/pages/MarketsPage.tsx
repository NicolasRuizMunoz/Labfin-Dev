import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Play, BarChart3, Zap } from 'lucide-react';
import { MarketSimulator } from '@/components/markets/MarketSimulator';
import { LiveEventGame } from '@/components/markets/LiveEventGame';
import { DifficultyLevelIndicator } from '@/components/DifficultyLevelIndicator';

const MarketsPage = () => {
  const [activeTab, setActiveTab] = useState('simulator');

  return (
    <div className="container max-w-6xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-lg bg-primary/10 mr-3">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Markets Simulator
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Practice investing in stocks, ETFs, mutual funds, and crypto with realistic market scenarios and live events
        </p>
      </div>

      <DifficultyLevelIndicator />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Market Simulator
          </TabsTrigger>
          <TabsTrigger value="live-events" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Live Event Game
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulator" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-financial"></div>
                  Portfolio Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  See how your investments could grow over time with different asset allocations and risk levels
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-risk-medium"></div>
                  Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Understand volatility, maximum drawdown, and risk-adjusted returns for different strategies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Educational Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get personalized feedback and learn key investing principles based on your choices
                </p>
              </CardContent>
            </Card>
          </div>

          <MarketSimulator />
        </TabsContent>

        <TabsContent value="live-events" className="space-y-6">
          <Card className="border-2 border-primary/20 bg-gradient-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Live Event Portfolio Game
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Build a portfolio and respond to real market events. Make buy/hold/sell decisions and see how they impact your returns.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                  Interactive
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <h4 className="font-semibold text-financial mb-1">Real Events</h4>
                  <p className="text-sm text-muted-foreground">Market news, earnings, policy changes</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-risk-medium mb-1">Quick Decisions</h4>
                  <p className="text-sm text-muted-foreground">Buy, Hold, or Sell in real-time</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-primary mb-1">Learn & Improve</h4>
                  <p className="text-sm text-muted-foreground">Get feedback on your choices</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <LiveEventGame />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketsPage;