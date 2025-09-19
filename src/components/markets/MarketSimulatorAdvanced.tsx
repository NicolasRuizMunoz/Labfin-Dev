import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Asset {
  id: string;
  name: string;
  ticker: string;
  class: 'stock' | 'etf' | 'mutual_fund' | 'crypto';
  region: 'local' | 'international';
  baseReturn: number;
  baseVolatility: number;
}

interface SimulationResult {
  month: number;
  value: number;
  contribution: number;
  totalContributions: number;
}

const ASSETS: Asset[] = [
  { id: '1', name: 'Tesla Inc.', ticker: 'TSLA', class: 'stock', region: 'local', baseReturn: 0.15, baseVolatility: 0.35 },
  { id: '2', name: 'Apple Inc.', ticker: 'AAPL', class: 'stock', region: 'local', baseReturn: 0.12, baseVolatility: 0.25 },
  { id: '3', name: 'S&P 500 ETF', ticker: 'SPY', class: 'etf', region: 'local', baseReturn: 0.10, baseVolatility: 0.18 },
  { id: '4', name: 'Brazil ETF', ticker: 'EWZ', class: 'etf', region: 'international', baseReturn: 0.08, baseVolatility: 0.28 },
  { id: '5', name: 'Bitcoin', ticker: 'BTC', class: 'crypto', region: 'local', baseReturn: 0.25, baseVolatility: 0.60 },
  { id: '6', name: 'Ethereum', ticker: 'ETH', class: 'crypto', region: 'local', baseReturn: 0.20, baseVolatility: 0.55 },
  { id: '7', name: 'Total Market Fund', ticker: 'VTI', class: 'mutual_fund', region: 'local', baseReturn: 0.09, baseVolatility: 0.16 },
  { id: '8', name: 'Emerging Markets', ticker: 'VWO', class: 'etf', region: 'international', baseReturn: 0.07, baseVolatility: 0.24 }
];

export const MarketSimulatorAdvanced = () => {
  const { t } = useLanguage();
  const [initialAmount, setInitialAmount] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [years, setYears] = useState([10]);
  const [riskLevel, setRiskLevel] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['3']); // SPY by default
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [finalStats, setFinalStats] = useState<{
    finalValue: number;
    totalReturn: number;
    totalContributions: number;
    annualizedReturn: number;
    maxDrawdown: number;
  } | null>(null);

  const getRiskMultiplier = (level: string) => {
    switch (level) {
      case 'conservative': return { returnAdj: -0.02, volAdj: 0.6 };
      case 'moderate': return { returnAdj: 0, volAdj: 1.0 };
      case 'aggressive': return { returnAdj: 0.02, volAdj: 1.4 };
      default: return { returnAdj: 0, volAdj: 1.0 };
    }
  };

  const runSimulation = () => {
    const totalMonths = years[0] * 12;
    const results: SimulationResult[] = [];
    const multiplier = getRiskMultiplier(riskLevel);

    // Get selected assets
    const assets = ASSETS.filter(asset => selectedAssets.includes(asset.id));
    if (assets.length === 0) return;

    // Calculate weighted average return and volatility
    const avgReturn = assets.reduce((sum, asset) => sum + asset.baseReturn, 0) / assets.length + multiplier.returnAdj;
    const avgVolatility = assets.reduce((sum, asset) => sum + asset.baseVolatility, 0) / assets.length * multiplier.volAdj;

    let currentValue = initialAmount;
    let totalContributions = initialAmount;
    let maxValue = currentValue;
    let maxDrawdown = 0;

    for (let month = 0; month <= totalMonths; month++) {
      if (month > 0) {
        // Add monthly contribution
        currentValue += monthlyContribution;
        totalContributions += monthlyContribution;

        // Apply market return with volatility
        const monthlyReturn = avgReturn / 12;
        const monthlyVol = avgVolatility / Math.sqrt(12);
        const shock = (Math.random() - 0.5) * 2 * monthlyVol; // Simplified normal distribution
        const totalReturn = monthlyReturn + shock;

        currentValue *= (1 + totalReturn);

        // Track drawdown
        if (currentValue > maxValue) {
          maxValue = currentValue;
        } else {
          const drawdown = (maxValue - currentValue) / maxValue;
          maxDrawdown = Math.max(maxDrawdown, drawdown);
        }
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

    setFinalStats({
      finalValue,
      totalReturn,
      totalContributions,
      annualizedReturn,
      maxDrawdown
    });
  };

  useEffect(() => {
    runSimulation();
  }, [initialAmount, monthlyContribution, years, riskLevel, selectedAssets]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };

  const getAssetBadgeColor = (assetClass: string) => {
    switch (assetClass) {
      case 'stock': return 'border-primary text-primary';
      case 'etf': return 'border-financial text-financial';
      case 'mutual_fund': return 'border-risk-medium text-risk-medium';
      case 'crypto': return 'border-risk-high text-risk-high';
      default: return 'border-muted-foreground text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investment Parameters</CardTitle>
            <CardDescription>Configure your investment scenario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initial-amount">{t('initialInvestment')}</Label>
              <Input
                id="initial-amount"
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Number(e.target.value))}
                min="100"
                step="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-contribution">{t('monthlyContribution')}</Label>
              <Input
                id="monthly-contribution"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                min="0"
                step="50"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('investmentTimeline')}: {years[0]} {t('years')}</Label>
              <Slider
                value={years}
                onValueChange={setYears}
                max={20}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Risk Profile</Label>
              <Select value={riskLevel} onValueChange={(value: any) => setRiskLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative (Lower risk, lower returns)</SelectItem>
                  <SelectItem value="moderate">Moderate (Balanced approach)</SelectItem>
                  <SelectItem value="aggressive">Aggressive (Higher risk, higher potential returns)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Asset Selection</CardTitle>
            <CardDescription>Choose your investment assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {ASSETS.map((asset) => (
                <div
                  key={asset.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAssets.includes(asset.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    if (selectedAssets.includes(asset.id)) {
                      setSelectedAssets(prev => prev.filter(id => id !== asset.id));
                    } else {
                      setSelectedAssets(prev => [...prev, asset.id]);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{asset.ticker}</span>
                      <Badge variant="outline" className={getAssetBadgeColor(asset.class)}>
                        {asset.class.replace('_', ' ')}
                      </Badge>
                      {asset.region === 'international' && (
                        <Badge variant="outline" className="text-xs">
                          International
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{asset.name}</p>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Expected: {formatPercentage(asset.baseReturn)}</span>
                    <span>Volatility: {formatPercentage(asset.baseVolatility)}</span>
                  </div>
                </div>
              ))}
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
                  <span className="text-sm text-muted-foreground">{t('finalValueAdvanced')}</span>
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
                  <span className="text-sm text-muted-foreground">{t('totalReturn')}</span>
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
                  <span className="text-sm text-muted-foreground">{t('annualReturn')}</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatPercentage(finalStats.annualizedReturn)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-risk-high" />
                  <span className="text-sm text-muted-foreground">{t('maxDrawdown')}</span>
                </div>
                <p className="text-2xl font-bold text-risk-high">
                  -{formatPercentage(finalStats.maxDrawdown)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Growth Over Time</CardTitle>
              <CardDescription>
                Your portfolio value compared to total contributions
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
                        name === 'value' ? 'Portfolio Value' : 'Total Contributions'
                      ]}
                      labelFormatter={(month: number) => `Month ${month} (Year ${Math.floor(month / 12)})`}
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
                Educational Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Key Learnings:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Compound growth accelerates over longer time periods</li>
                    <li>• Regular contributions help smooth out market volatility</li>
                    <li>• Higher risk assets have potential for greater returns but larger drawdowns</li>
                    <li>• Diversification across asset classes can reduce overall portfolio risk</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Next Steps:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Try different asset combinations to see impact on returns</li>
                    <li>• Experiment with various risk profiles</li>
                    <li>• Test how changing contribution amounts affects outcomes</li>
                    <li>• Play the Live Event Game to experience market volatility</li>
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