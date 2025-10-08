import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Info, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SimulationResult {
  month: number;
  value: number;
  contribution: number;
  totalContributions: number;
}

export const MarketSimulatorBeginner = () => {
  const { t } = useLanguage();
  const [initialAmount, setInitialAmount] = useState(1000);
  const [monthlyContribution, setMonthlyContribution] = useState(100);
  const [years, setYears] = useState([5]);
  const [investmentType, setInvestmentType] = useState<'safe' | 'balanced' | 'growth'>('balanced');
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [finalStats, setFinalStats] = useState<{
    finalValue: number;
    totalReturn: number;
    totalContributions: number;
  } | null>(null);

  const getInvestmentSettings = (type: string) => {
    switch (type) {
      case 'safe': return { return: 0.04, name: 'Safe & Steady', description: 'Like a savings account but better!' };
      case 'balanced': return { return: 0.07, name: 'Balanced Growth', description: 'Mix of safety and growth' };
      case 'growth': return { return: 0.10, name: 'Growth Focused', description: 'Higher potential returns' };
      default: return { return: 0.07, name: 'Balanced Growth', description: 'Mix of safety and growth' };
    }
  };

  const runSimulation = () => {
    const totalMonths = years[0] * 12;
    const results: SimulationResult[] = [];
    const settings = getInvestmentSettings(investmentType);
    const monthlyReturn = settings.return / 12;

    let currentValue = initialAmount;
    let totalContributions = initialAmount;

    for (let month = 0; month <= totalMonths; month++) {
      if (month > 0) {
        // Add monthly contribution
        currentValue += monthlyContribution;
        totalContributions += monthlyContribution;

        // Apply simple compound growth (no volatility for beginners)
        currentValue *= (1 + monthlyReturn);
      }

      results.push({
        month,
        value: Math.round(currentValue),
        contribution: month === 0 ? initialAmount : monthlyContribution,
        totalContributions: Math.round(totalContributions)
      });
    }

    setSimulationResults(results);

    const finalValue = results[results.length - 1].value;
    const totalReturn = finalValue - totalContributions;

    setFinalStats({
      finalValue,
      totalReturn,
      totalContributions
    });
  };

  useEffect(() => {
    runSimulation();
  }, [initialAmount, monthlyContribution, years, investmentType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const settings = getInvestmentSettings(investmentType);

  return (
    <div className="space-y-6">
      {/* Educational Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">{t('welcomeFirstInvestment')}</h3>
              <p className="text-muted-foreground">
                {t('simplifiedVersion')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple Input Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {t('yourMoney')}
            </CardTitle>
            <CardDescription>{t('howMuchInvest')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initial-amount">{t('startingAmount')}</Label>
              <Input
                id="initial-amount"
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Number(e.target.value))}
                min="100"
                step="100"
              />
              <p className="text-xs text-muted-foreground">
                💡 {t('evenSmallAmounts')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-contribution">{t('monthlySavings')}</Label>
              <Input
                id="monthly-contribution"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                min="10"
                step="10"
              />
              <p className="text-xs text-muted-foreground">
                💡 {t('regularSaving')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t('timeLetMoneyGrow')} {years[0]} {t('years')}</Label>
              <Slider
                value={years}
                onValueChange={setYears}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                💡 {t('timeYourBestFriend')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('investmentStyle')}
            </CardTitle>
            <CardDescription>{t('chooseComfortLevel')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {['safe', 'balanced', 'growth'].map((type) => {
                const setting = getInvestmentSettings(type);
                return (
                  <div
                    key={type}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      investmentType === type
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setInvestmentType(type as any)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{setting.name}</h4>
                      <Badge variant="outline">
                        {(setting.return * 100).toFixed(0)}% {t('yearlyReturn')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{t('currentChoice')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>{settings.name}:</strong> {settings.description}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {simulationResults.length > 0 && finalStats && (
        <div className="space-y-6">
          {/* Simple Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-financial/20">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-financial mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">{t('yourMoneyGrowsTo')}</p>
                <p className="text-3xl font-bold text-financial">
                  {formatCurrency(finalStats.finalValue)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">{t('moneyYouEarned')}</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(finalStats.totalReturn)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/20">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">{t('moneyYouPutIn')}</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(finalStats.totalContributions)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Simple Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('watchMoneyGrow')}</CardTitle>
              <CardDescription>
                {t('blueLineShows')} {years[0]} años
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
                        name === 'value' ? t('totalValue') : t('moneyYouPutIn')
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
                      strokeWidth={4}
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
                <Lightbulb className="w-5 h-5 text-financial" />
                {t('whatYouLearned')} 
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">{t('keyDiscoveries')}</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• {t('moneyGrowsFaster')}</li>
                    <li>• {t('regularSavingPowerful')}</li>
                    <li>• {t('startingEarlyAdvantage')}</li>
                    <li>• {t('differentInvestmentTypes')}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t('nextStepsMarkets')}</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• {t('tryDifferentAmounts')}</li>
                    <li>• {t('compareThreeStyles')}</li>
                    <li>• {t('playLiveEventGame')}</li>
                    <li>• {t('readyMoreTakeAssessmentMarkets')}</li>
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