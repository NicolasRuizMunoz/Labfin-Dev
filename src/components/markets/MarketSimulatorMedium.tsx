import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar, AlertTriangle, Target } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  ticker: string;
  class: 'conservative' | 'balanced' | 'growth';
  baseReturn: number;
  baseVolatility: number;
  description: string;
}

interface SimulationResult {
  month: number;
  value: number;
  contribution: number;
  totalContributions: number;
}

const MEDIUM_ASSETS: Asset[] = [
  { 
    id: '1', 
    name: 'High-Yield Savings', 
    ticker: 'HYSA', 
    class: 'conservative', 
    baseReturn: 0.045, 
    baseVolatility: 0.01,
    description: 'Very safe, guaranteed returns like a bank account'
  },
  { 
    id: '2', 
    name: 'Government Bonds', 
    ticker: 'GOVT', 
    class: 'conservative', 
    baseReturn: 0.05, 
    baseVolatility: 0.05,
    description: 'Safe investments backed by the government'
  },
  { 
    id: '3', 
    name: 'Balanced Fund', 
    ticker: 'BAL', 
    class: 'balanced', 
    baseReturn: 0.08, 
    baseVolatility: 0.12,
    description: 'Mix of stocks and bonds for steady growth'
  },
  { 
    id: '4', 
    name: 'S&P 500 Index', 
    ticker: 'SPY', 
    class: 'balanced', 
    baseReturn: 0.10, 
    baseVolatility: 0.16,
    description: '500 largest US companies - proven long-term performer'
  },
  { 
    id: '5', 
    name: 'Growth Stocks', 
    ticker: 'GROW', 
    class: 'growth', 
    baseReturn: 0.12, 
    baseVolatility: 0.22,
    description: 'Companies expected to grow faster than average'
  },
  { 
    id: '6', 
    name: 'Technology ETF', 
    ticker: 'TECH', 
    class: 'growth', 
    baseReturn: 0.13, 
    baseVolatility: 0.25,
    description: 'Tech companies with high growth potential'
  }
];

export const MarketSimulatorMedium = () => {
  const [initialAmount, setInitialAmount] = useState(5000);
  const [monthlyContribution, setMonthlyContribution] = useState(300);
  const [years, setYears] = useState([10]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['3', '4']); // Balanced by default
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [finalStats, setFinalStats] = useState<{
    finalValue: number;
    totalReturn: number;
    totalContributions: number;
    annualizedReturn: number;
    riskLevel: string;
  } | null>(null);

  const runSimulation = () => {
    const totalMonths = years[0] * 12;
    const results: SimulationResult[] = [];

    // Get selected assets
    const assets = MEDIUM_ASSETS.filter(asset => selectedAssets.includes(asset.id));
    if (assets.length === 0) return;

    // Calculate portfolio characteristics
    const avgReturn = assets.reduce((sum, asset) => sum + asset.baseReturn, 0) / assets.length;
    const avgVolatility = assets.reduce((sum, asset) => sum + asset.baseVolatility, 0) / assets.length;

    let currentValue = initialAmount;
    let totalContributions = initialAmount;

    for (let month = 0; month <= totalMonths; month++) {
      if (month > 0) {
        // Add monthly contribution
        currentValue += monthlyContribution;
        totalContributions += monthlyContribution;

        // Apply market return with some volatility (simplified)
        const monthlyReturn = avgReturn / 12;
        const monthlyVol = avgVolatility / Math.sqrt(12);
        const volatilityFactor = 1 + (Math.random() - 0.5) * monthlyVol * 0.5; // Reduced volatility for medium level
        
        currentValue *= (1 + monthlyReturn) * volatilityFactor;
      }

      results.push({
        month,
        value: Math.round(currentValue),
        contribution: month === 0 ? initialAmount : monthlyContribution,
        totalContributions: Math.round(totalContributions)
      });
    }

    setSimulationResults(results);

    // Calculate final stats
    const finalValue = results[results.length - 1].value;
    const totalReturn = finalValue - totalContributions;
    const annualizedReturn = Math.pow(finalValue / initialAmount, 1 / years[0]) - 1;

    // Determine risk level
    let riskLevel = 'Low';
    if (avgVolatility > 0.15) riskLevel = 'High';
    else if (avgVolatility > 0.08) riskLevel = 'Medium';

    setFinalStats({
      finalValue,
      totalReturn,
      totalContributions,
      annualizedReturn,
      riskLevel
    });
  };

  useEffect(() => {
    runSimulation();
  }, [initialAmount, monthlyContribution, years, selectedAssets]);

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

  const getAssetClassColor = (assetClass: string) => {
    switch (assetClass) {
      case 'conservative': return 'border-blue-300 text-blue-700 bg-blue-50';
      case 'balanced': return 'border-yellow-300 text-yellow-700 bg-yellow-50';
      case 'growth': return 'border-red-300 text-red-700 bg-red-50';
      default: return 'border-gray-300 text-gray-700 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Educational Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Medium Level Investment Simulator</h3>
              <p className="text-sm text-muted-foreground">
                Now you can choose from different types of investments! Mix conservative, balanced, and growth assets 
                to create a portfolio that matches your comfort level. Learn about risk vs. reward.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investment Settings</CardTitle>
            <CardDescription>Configure your investment plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initial-amount">Starting Investment</Label>
              <Input
                id="initial-amount"
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Number(e.target.value))}
                min="500"
                step="500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-contribution">Monthly Investment</Label>
              <Input
                id="monthly-contribution"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                min="50"
                step="50"
              />
            </div>

            <div className="space-y-2">
              <Label>Investment Time: {years[0]} years</Label>
              <Slider
                value={years}
                onValueChange={setYears}
                max={15}
                min={3}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                💡 Longer time periods help smooth out market ups and downs
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose Your Investments</CardTitle>
            <CardDescription>Pick 2-3 investments to diversify your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {MEDIUM_ASSETS.map((asset) => (
                <div
                  key={asset.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAssets.includes(asset.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    if (selectedAssets.includes(asset.id)) {
                      if (selectedAssets.length > 1) { // Keep at least one selected
                        setSelectedAssets(prev => prev.filter(id => id !== asset.id));
                      }
                    } else {
                      setSelectedAssets(prev => [...prev, asset.id]);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{asset.ticker}</span>
                      <Badge variant="outline" className={getAssetClassColor(asset.class)}>
                        {asset.class}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatPercentage(asset.baseReturn)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{asset.description}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Diversification tip:</strong> Choose different types (conservative, balanced, growth) 
                to reduce risk while maintaining growth potential.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {simulationResults.length > 0 && finalStats && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-financial" />
                  <span className="text-sm text-muted-foreground">Final Value</span>
                </div>
                <p className="text-2xl font-bold text-financial">
                  {formatCurrency(finalStats.finalValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Profit Made</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(finalStats.totalReturn)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Yearly Return</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatPercentage(finalStats.annualizedReturn)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-risk-medium" />
                  <span className="text-sm text-muted-foreground">Risk Level</span>
                </div>
                <p className="text-2xl font-bold text-risk-medium">
                  {finalStats.riskLevel}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Growth Over Time</CardTitle>
              <CardDescription>
                See how your diversified portfolio performs over {years[0]} years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simulationResults}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value) => `Year ${Math.floor(value / 12)}`}
                    />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'value' ? 'Portfolio Value' : 'Money You Put In'
                      ]}
                      labelFormatter={(month: number) => `Month ${month}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalContributions" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="contributions"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Educational Insights */}
          <Card className="border-financial/20 bg-gradient-success/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-financial" />
                What You're Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">📊 Portfolio Concepts:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Diversification:</strong> Spreading risk across different investments</li>
                    <li>• <strong>Asset Classes:</strong> Different types have different risk/return profiles</li>
                    <li>• <strong>Risk vs. Return:</strong> Higher potential returns usually mean higher risk</li>
                    <li>• <strong>Time Horizon:</strong> Longer investing periods can handle more volatility</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🎯 Try These Experiments:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Compare all-conservative vs. all-growth portfolios</li>
                    <li>• See how different time periods affect your results</li>
                    <li>• Try the Live Event Game to experience market volatility</li>
                    <li>• Ready for more complexity? Take the assessment for advanced mode!</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};