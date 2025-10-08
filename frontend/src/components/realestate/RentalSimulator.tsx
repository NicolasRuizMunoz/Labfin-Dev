import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Building2, DollarSign, TrendingUp, Zap, Calendar, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RentalEvent {
  id: string;
  title: string;
  description: string;
  impact: {
    rent?: number;
    expenses?: number;
    vacancy?: number;
    appreciation?: number;
  };
  year: number;
}

interface YearlyData {
  year: number;
  rent: number;
  expenses: number;
  noi: number;
  propertyValue: number;
  cashFlow: number;
  cumulativeCashFlow: number;
}

const RENTAL_EVENTS: RentalEvent[] = [
  {
    id: '1',
    title: 'New Metro Line Announced',
    description: 'City announces new public transit line near your property.',
    impact: { rent: 100, appreciation: 0.02 },
    year: 3
  },
  {
    id: '2',
    title: 'Major Employer Relocates',
    description: 'Large tech company moves headquarters to nearby area.',
    impact: { rent: 150, appreciation: 0.03 },
    year: 5
  },
  {
    id: '3',
    title: 'Economic Downtown',
    description: 'Local economic challenges affect rental demand.',
    impact: { rent: -80, vacancy: 5 },
    year: 7
  },
  {
    id: '4',
    title: 'Property Tax Increase',
    description: 'City increases property tax rates for infrastructure improvements.',
    impact: { expenses: 1200 },
    year: 4
  },
  {
    id: '5',
    title: 'Neighborhood Revitalization',
    description: 'Major urban renewal project improves area desirability.',
    impact: { rent: 200, appreciation: 0.04 },
    year: 6
  }
];

export const RentalSimulator = () => {
  const { t } = useLanguage();
  const [propertyPrice, setPropertyPrice] = useState(300000);
  const [monthlyRent, setMonthlyRent] = useState(2500);
  const [monthlyExpenses, setMonthlyExpenses] = useState(800);
  const [vacancyRate, setVacancyRate] = useState([5]);
  const [appreciationRate, setAppreciationRate] = useState([3]);
  const [holdingYears, setHoldingYears] = useState([10]);
  const [includeEvents, setIncludeEvents] = useState(true);

  const [results, setResults] = useState<{
    capRate: number;
    noi: number;
    yearlyData: YearlyData[];
    totalCashFlow: number;
    totalAppreciation: number;
    totalReturn: number;
    irr: number;
    events: RentalEvent[];
  } | null>(null);

  const calculateRental = () => {
    const annualRent = monthlyRent * 12;
    const annualExpenses = monthlyExpenses * 12;
    const effectiveRent = annualRent * (1 - vacancyRate[0] / 100);
    const noi = effectiveRent - annualExpenses;
    const capRate = noi / propertyPrice;

    const yearlyData: YearlyData[] = [];
    const appliedEvents: RentalEvent[] = [];
    
    let currentRent = monthlyRent;
    let currentExpenses = monthlyExpenses;
    let currentVacancy = vacancyRate[0];
    let currentAppreciation = appreciationRate[0] / 100;
    let currentPropertyValue = propertyPrice;
    let cumulativeCashFlow = 0;

    for (let year = 1; year <= holdingYears[0]; year++) {
      // Check for events this year
      if (includeEvents) {
        const yearEvents = RENTAL_EVENTS.filter(event => event.year === year);
        yearEvents.forEach(event => {
          if (Math.random() > 0.5) { // 50% chance event occurs
            appliedEvents.push(event);
            
            if (event.impact.rent) currentRent += event.impact.rent;
            if (event.impact.expenses) currentExpenses += event.impact.expenses / 12;
            if (event.impact.vacancy) currentVacancy += event.impact.vacancy;
            if (event.impact.appreciation) currentAppreciation += event.impact.appreciation;
          }
        });
      }

      // Calculate this year's performance
      const annualRentThisYear = currentRent * 12;
      const annualExpensesThisYear = currentExpenses * 12;
      const effectiveRentThisYear = annualRentThisYear * (1 - Math.min(currentVacancy, 50) / 100);
      const noiThisYear = effectiveRentThisYear - annualExpensesThisYear;
      
      currentPropertyValue *= (1 + currentAppreciation);
      cumulativeCashFlow += noiThisYear;

      yearlyData.push({
        year,
        rent: annualRentThisYear,
        expenses: annualExpensesThisYear,
        noi: noiThisYear,
        propertyValue: currentPropertyValue,
        cashFlow: noiThisYear,
        cumulativeCashFlow
      });

      // Apply modest rent growth each year (2-3%)
      currentRent *= 1.025;
      currentExpenses *= 1.02; // Expenses grow slightly slower
    }

    const totalCashFlow = cumulativeCashFlow;
    const totalAppreciation = currentPropertyValue - propertyPrice;
    const totalReturn = totalCashFlow + totalAppreciation;

    // Simplified IRR calculation (approximation)
    const totalInvestment = propertyPrice; // Assuming cash purchase for simplicity
    const finalValue = currentPropertyValue + (yearlyData[yearlyData.length - 1]?.noi || 0);
    const irr = Math.pow(finalValue / totalInvestment, 1 / holdingYears[0]) - 1;

    setResults({
      capRate,
      noi,
      yearlyData,
      totalCashFlow,
      totalAppreciation,
      totalReturn,
      irr,
      events: appliedEvents
    });
  };

  useEffect(() => {
    calculateRental();
  }, [propertyPrice, monthlyRent, monthlyExpenses, vacancyRate, appreciationRate, holdingYears, includeEvents]);

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

  return (
    <div className="space-y-6">
      {/* Input Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Property Investment</CardTitle>
            <CardDescription>Configure your rental property scenario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property-price">Property Purchase Price</Label>
              <Input
                id="property-price"
                type="number"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(Number(e.target.value))}
                min="50000"
                step="10000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-rent">Monthly Rent</Label>
              <Input
                id="monthly-rent"
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                min="500"
                step="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-expenses">Monthly Expenses</Label>
              <Input
                id="monthly-expenses"
                type="number"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                min="100"
                step="50"
              />
              <p className="text-xs text-muted-foreground">
                Includes property tax, insurance, maintenance, property management
              </p>
            </div>

            <div className="space-y-2">
              <Label>Vacancy Rate: {vacancyRate[0]}%</Label>
              <Slider
                value={vacancyRate}
                onValueChange={setVacancyRate}
                max={20}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Market Assumptions</CardTitle>
            <CardDescription>Long-term market conditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Annual Appreciation: {appreciationRate[0]}%</Label>
              <Slider
                value={appreciationRate}
                onValueChange={setAppreciationRate}
                max={8}
                min={0}
                step={0.5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Holding Period: {holdingYears[0]} years</Label>
              <Slider
                value={holdingYears}
                onValueChange={setHoldingYears}
                max={20}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Include Market Events</Label>
                <Button
                  variant={includeEvents ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIncludeEvents(!includeEvents)}
                >
                  {includeEvents ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Simulate real-world events that could affect your investment
              </p>
            </div>

            {/* Quick Stats */}
            {results && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Initial Metrics</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Gross Rent Yield:</span>
                    <span className="font-medium">
                      {formatPercentage((monthlyRent * 12) / propertyPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cap Rate:</span>
                    <span className="font-medium">{formatPercentage(results.capRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly NOI:</span>
                    <span className="font-medium">{formatCurrency(results.noi / 12)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-financial" />
                  <span className="text-sm text-muted-foreground">Cap Rate</span>
                </div>
                <p className="text-2xl font-bold text-financial">
                  {formatPercentage(results.capRate)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Cash Flow</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(results.totalCashFlow)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-financial" />
                  <span className="text-sm text-muted-foreground">Appreciation</span>
                </div>
                <p className="text-2xl font-bold text-financial">
                  {formatCurrency(results.totalAppreciation)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">IRR (Est.)</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatPercentage(results.irr)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Performance Over Time</CardTitle>
              <CardDescription>
                Property value and cumulative cash flow progression
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'propertyValue' ? 'Property Value' : 'Cumulative Cash Flow'
                      ]}
                      labelFormatter={(year: number) => `Year ${year}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeCashFlow" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="cumulativeCashFlow"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="propertyValue" 
                      stroke="hsl(var(--financial))" 
                      strokeWidth={3}
                      name="propertyValue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Events Timeline */}
          {results.events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Market Events During Holding Period
                </CardTitle>
                <CardDescription>
                  Real-world events that affected your investment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.events.map((event, index) => (
                    <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">Year {event.year}</Badge>
                          <h4 className="font-medium">{event.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                      <div className="text-right">
                        {event.impact.rent && (
                          <p className={`text-sm ${event.impact.rent > 0 ? 'text-financial' : 'text-risk-high'}`}>
                            Rent: {event.impact.rent > 0 ? '+' : ''}{formatCurrency(event.impact.rent)}/mo
                          </p>
                        )}
                        {event.impact.appreciation && (
                          <p className="text-sm text-financial">
                            Appreciation: +{formatPercentage(event.impact.appreciation)}
                          </p>
                        )}
                        {event.impact.expenses && (
                          <p className="text-sm text-risk-high">
                            Expenses: +{formatCurrency(event.impact.expenses)}/year
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Educational Insights */}
          <Card className="border-financial/20 bg-gradient-success/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-financial" />
                  {t('realEstateInvestmentInsights')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Key Metrics Explained:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Cap Rate:</strong> {formatPercentage(results.capRate)} - Annual NOI ÷ Property Value</li>
                    <li>• <strong>NOI:</strong> Net Operating Income (rent - expenses)</li>
                    <li>• <strong>IRR:</strong> Internal Rate of Return (simplified estimate)</li>
                    <li>• Good cap rates vary by market (typically 4-10%)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Investment Tips:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Location drives both rent growth and appreciation</li>
                    <li>• Factor in vacancy, maintenance, and management costs</li>
                    <li>• Consider financing to leverage returns (not modeled here)</li>
                    <li>• Diversify across multiple properties when possible</li>
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