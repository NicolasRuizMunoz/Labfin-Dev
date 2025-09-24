import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Home, DollarSign, Calendar, TrendingUp, Info, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumulativeInterest: number;
  equity: number;
}

export const MortgageSimulatorAdvanced = () => {
  const { t } = useLanguage();
  const [propertyPrice, setPropertyPrice] = useState(400000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [propertyTax, setPropertyTax] = useState(8000);
  const [insurance, setInsurance] = useState(2400);
  const [showAmortization, setShowAmortization] = useState(false);

  const [calculations, setCalculations] = useState<{
    loanAmount: number;
    downPayment: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPayments: number;
    monthlyTaxInsurance: number;
    totalMonthlyPayment: number;
    amortizationSchedule: AmortizationEntry[];
  } | null>(null);

  const calculateMortgage = () => {
    const downPayment = propertyPrice * (downPaymentPercent / 100);
    const loanAmount = propertyPrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;
    
    // Calculate monthly payment using PMT formula
    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalPayments = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayments - loanAmount;
    const monthlyTaxInsurance = (propertyTax + insurance) / 12;
    const totalMonthlyPayment = monthlyPayment + monthlyTaxInsurance;

    // Generate amortization schedule
    const schedule: AmortizationEntry[] = [];
    let remainingBalance = loanAmount;
    let cumulativeInterest = 0;

    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;
      cumulativeInterest += interestPayment;
      
      const equity = propertyPrice - remainingBalance;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, remainingBalance),
        cumulativeInterest,
        equity
      });

      if (remainingBalance <= 0) break;
    }

    setCalculations({
      loanAmount,
      downPayment,
      monthlyPayment,
      totalInterest,
      totalPayments,
      monthlyTaxInsurance,
      totalMonthlyPayment,
      amortizationSchedule: schedule
    });
  };

  useEffect(() => {
    calculateMortgage();
  }, [propertyPrice, downPaymentPercent, interestRate, loanTermYears, propertyTax, insurance]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCurrencyDetailed = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Prepare chart data (yearly aggregation for readability)
  const chartData = calculations?.amortizationSchedule
    .filter((_, index) => index % 12 === 0) // Show every 12th month (yearly)
    .map(entry => ({
      year: Math.floor(entry.month / 12) + 1,
      equity: entry.equity,
      balance: entry.balance,
      cumulativeInterest: entry.cumulativeInterest
    })) || [];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Input Controls */}
        <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('propertyDetails')}</CardTitle>
            <CardDescription>{t('propertyDetailsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="property-price">{t('propertyPrice')}</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{t('propertyPriceTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
              <div className="flex items-center gap-2">
                <Label htmlFor="down-payment">{t('downPayment')}</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{t('downPaymentTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={downPaymentPercent.toString()} onValueChange={(value) => setDownPaymentPercent(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">{t('minimumDown')}</SelectItem>
                  <SelectItem value="10">{t('lowDown')}</SelectItem>
                  <SelectItem value="20">{t('avoidPMI')}</SelectItem>
                  <SelectItem value="25">{t('betterRates')}</SelectItem>
                  <SelectItem value="30">{t('lowerPayments')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="interest-rate">{t('interestRate')}</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{t('interestRateTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="interest-rate"
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                min="1"
                max="15"
                step="0.125"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-term">{t('loanTerm')}</Label>
              <Select value={loanTermYears.toString()} onValueChange={(value) => setLoanTermYears(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">{t('fifteenYears')}</SelectItem>
                  <SelectItem value="20">{t('twentyYears')}</SelectItem>
                  <SelectItem value="30">{t('thirtyYears')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('additionalCosts')}</CardTitle>
            <CardDescription>{t('additionalCostsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property-tax">{t('annualPropertyTax')}</Label>
              <Input
                id="property-tax"
                type="number"
                value={propertyTax}
                onChange={(e) => setPropertyTax(Number(e.target.value))}
                min="0"
                step="500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance">{t('annualInsurance')}</Label>
              <Input
                id="insurance"
                type="number"
                value={insurance}
                onChange={(e) => setInsurance(Number(e.target.value))}
                min="0"
                step="100"
              />
            </div>

            {/* Quick Stats */}
            {calculations && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">{t('quickOverview')}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>{t('downPaymentLabel')}</span>
                    <span className="font-medium">{formatCurrency(calculations.downPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('loanAmount')}</span>
                    <span className="font-medium">{formatCurrency(calculations.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('monthlyPI')}</span>
                    <span className="font-medium">{formatCurrency(calculations.monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('taxInsurance')}</span>
                    <span className="font-medium">{formatCurrency(calculations.monthlyTaxInsurance)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {calculations && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Home className="w-4 h-4 text-financial" />
                  <span className="text-sm text-muted-foreground">{t('totalMonthly')}</span>
                </div>
                <p className="text-2xl font-bold text-financial">
                  {formatCurrency(calculations.totalMonthlyPayment)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{t('piPayment')}</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(calculations.monthlyPayment)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-risk-high" />
                  <span className="text-sm text-muted-foreground">{t('totalInterest')}</span>
                </div>
                <p className="text-2xl font-bold text-risk-high">
                  {formatCurrency(calculations.totalInterest)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('totalPaid')}</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(calculations.totalPayments)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Equity Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('equityBuilding')}</CardTitle>
              <CardDescription>
                {t('equityBuildingDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <RechartsTooltip 
                     formatter={(value: number, name: string) => [
                       formatCurrency(value),
                       name === 'equity' ? t('homeEquity') : t('remainingBalance')
                     ]}
                      labelFormatter={(year: number) => `Year ${year}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="hsl(var(--risk-high))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="balance"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="hsl(var(--financial))" 
                      strokeWidth={3}
                      name="equity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Amortization Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('amortizationScheduleTable')}</CardTitle>
                  <CardDescription>
                    {t('amortizationScheduleTableDesc')}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAmortization(!showAmortization)}
                >
                  {showAmortization ? t('hideSchedule') : t('showSchedule')}
                </Button>
              </div>
            </CardHeader>
            {showAmortization && (
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('month')}</TableHead>
                          <TableHead>{t('payment')}</TableHead>
                          <TableHead>{t('principal')}</TableHead>
                          <TableHead>{t('interest')}</TableHead>
                          <TableHead>{t('balance')}</TableHead>
                          <TableHead>{t('equity')}</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {calculations.amortizationSchedule.slice(0, 60).map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{entry.month}</TableCell>
                          <TableCell>{formatCurrencyDetailed(entry.payment)}</TableCell>
                          <TableCell className="text-financial">
                            {formatCurrencyDetailed(entry.principal)}
                          </TableCell>
                          <TableCell className="text-risk-high">
                            {formatCurrencyDetailed(entry.interest)}
                          </TableCell>
                          <TableCell>{formatCurrency(entry.balance)}</TableCell>
                          <TableCell className="text-primary">
                            {formatCurrency(entry.equity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {calculations.amortizationSchedule.length > 60 && (
                    <p className="text-sm text-muted-foreground text-center mt-4">
                      {t('showingFirst')} {calculations.amortizationSchedule.length} {t('totalPaymentsText')}
                    </p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Educational Insights */}
          <Card className="border-financial/20 bg-gradient-success/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-financial" />
                  {t('educationalInsights')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">{t('keyLearnings')}:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{t('realEstateKeyLearnings1')}</li>
                    <li>{t('realEstateKeyLearnings2')}</li>
                    <li>{t('realEstateKeyLearnings3')}</li>
                    <li>{t('realEstateKeyLearnings4')}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t('advancedStrategies')}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{t('realEstateAdvanced1')}</li>
                    <li>{t('realEstateAdvanced2')}</li>
                    <li>{t('realEstateAdvanced3')}</li>
                    <li>{t('realEstateAdvanced4')}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
};