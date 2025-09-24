import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CreditCard, DollarSign, Calendar, TrendingDown, Clock, Calculator } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumulativeInterest: number;
}

export const LoanSimulatorAdvanced = () => {
  const { t } = useLanguage();
  const [loanAmount, setLoanAmount] = useState(25000);
  const [annualRate, setAnnualRate] = useState(8.5);
  const [termMonths, setTermMonths] = useState(60);
  const [extraPayment, setExtraPayment] = useState(0);
  const [showAmortization, setShowAmortization] = useState(false);

  const [calculations, setCalculations] = useState<{
    monthlyPayment: number;
    totalInterest: number;
    totalPayments: number;
    payoffDate: string;
    amortizationSchedule: PaymentEntry[];
    // Comparison with extra payments
    extraPaymentResults?: {
      monthlyPayment: number;
      totalInterest: number;
      monthsSaved: number;
      interestSaved: number;
      payoffDate: string;
      amortizationSchedule: PaymentEntry[];
    };
  } | null>(null);

  const calculateLoan = () => {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = termMonths;
    
    // Calculate monthly payment using PMT formula
    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    // Generate amortization schedule for base loan
    const schedule: PaymentEntry[] = [];
    let remainingBalance = loanAmount;
    let cumulativeInterest = 0;

    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;
      cumulativeInterest += interestPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, remainingBalance),
        cumulativeInterest
      });

      if (remainingBalance <= 0) break;
    }

    const totalPayments = monthlyPayment * schedule.length;
    const totalInterest = cumulativeInterest;
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + schedule.length);

    let extraPaymentResults;

    // Calculate with extra payments if specified
    if (extraPayment > 0) {
      const extraSchedule: PaymentEntry[] = [];
      let extraRemainingBalance = loanAmount;
      let extraCumulativeInterest = 0;
      let extraMonth = 1;

      while (extraRemainingBalance > 0.01 && extraMonth <= numberOfPayments * 2) {
        const interestPayment = extraRemainingBalance * monthlyRate;
        const basePrincipalPayment = monthlyPayment - interestPayment;
        const totalPrincipalPayment = Math.min(
          basePrincipalPayment + extraPayment,
          extraRemainingBalance
        );
        const actualPayment = interestPayment + totalPrincipalPayment;
        
        extraRemainingBalance -= totalPrincipalPayment;
        extraCumulativeInterest += interestPayment;

        extraSchedule.push({
          month: extraMonth,
          payment: actualPayment,
          principal: totalPrincipalPayment,
          interest: interestPayment,
          balance: Math.max(0, extraRemainingBalance),
          cumulativeInterest: extraCumulativeInterest
        });

        extraMonth++;
      }

      const extraPayoffDate = new Date();
      extraPayoffDate.setMonth(extraPayoffDate.getMonth() + extraSchedule.length);
      
      extraPaymentResults = {
        monthlyPayment: monthlyPayment + extraPayment,
        totalInterest: extraCumulativeInterest,
        monthsSaved: schedule.length - extraSchedule.length,
        interestSaved: totalInterest - extraCumulativeInterest,
        payoffDate: extraPayoffDate.toLocaleDateString(),
        amortizationSchedule: extraSchedule
      };
    }

    setCalculations({
      monthlyPayment,
      totalInterest,
      totalPayments,
      payoffDate: payoffDate.toLocaleDateString(),
      amortizationSchedule: schedule,
      extraPaymentResults
    });
  };

  useEffect(() => {
    calculateLoan();
  }, [loanAmount, annualRate, termMonths, extraPayment]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCurrencySimple = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Prepare chart data comparing base loan vs extra payments
  const chartData = calculations?.amortizationSchedule.map((entry, index) => {
    const extraEntry = calculations.extraPaymentResults?.amortizationSchedule[index];
    return {
      month: entry.month,
      baseBalance: entry.balance,
      extraBalance: extraEntry?.balance || 0,
      baseInterest: entry.cumulativeInterest,
      extraInterest: extraEntry?.cumulativeInterest || 0
    };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Input Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Loan Details</CardTitle>
            <CardDescription>Configure your loan parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loan-amount">{t('loanAmountField')}</Label>
              <Input
                id="loan-amount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                min="1000"
                step="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annual-rate">{t('annualInterestRate')}</Label>
              <Input
                id="annual-rate"
                type="number"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                min="0.1"
                max="30"
                step="0.25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Loan Term</Label>
              <Select value={termMonths.toString()} onValueChange={(value) => setTermMonths(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">1 year (12 months)</SelectItem>
                  <SelectItem value="24">2 years (24 months)</SelectItem>
                  <SelectItem value="36">3 years (36 months)</SelectItem>
                  <SelectItem value="48">4 years (48 months)</SelectItem>
                  <SelectItem value="60">5 years (60 months)</SelectItem>
                  <SelectItem value="72">6 years (72 months)</SelectItem>
                  <SelectItem value="84">7 years (84 months)</SelectItem>
                  <SelectItem value="96">8 years (96 months)</SelectItem>
                  <SelectItem value="120">10 years (120 months)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra-payment">{t('extraMonthlyPayment')}</Label>
              <Input
                id="extra-payment"
                type="number"
                value={extraPayment}
                onChange={(e) => setExtraPayment(Number(e.target.value))}
                min="0"
                step="25"
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Additional amount applied to principal each month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Loan Summary</CardTitle>
            <CardDescription>Key loan metrics and comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {calculations && (
              <div className="space-y-4">
                {/* Base Loan */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-primary">Standard Loan</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Monthly Payment:</span>
                      <span className="font-medium">{formatCurrency(calculations.monthlyPayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Interest:</span>
                      <span className="font-medium text-risk-high">{formatCurrencySimple(calculations.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payoff Date:</span>
                      <span className="font-medium">{calculations.payoffDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Paid:</span>
                      <span className="font-medium">{formatCurrencySimple(calculations.totalPayments)}</span>
                    </div>
                  </div>
                </div>

                {/* Extra Payment Results */}
                {calculations.extraPaymentResults && (
                  <div className="p-4 bg-financial/10 rounded-lg">
                    <h4 className="font-semibold mb-3 text-financial">With Extra Payments</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monthly Payment:</span>
                        <span className="font-medium">{formatCurrency(calculations.extraPaymentResults.monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Interest:</span>
                        <span className="font-medium text-financial">{formatCurrencySimple(calculations.extraPaymentResults.totalInterest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payoff Date:</span>
                        <span className="font-medium">{calculations.extraPaymentResults.payoffDate}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-financial border-t pt-2">
                        <span>Interest Saved:</span>
                        <span>{formatCurrencySimple(calculations.extraPaymentResults.interestSaved)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-financial">
                        <span>Time Saved:</span>
                        <span>{calculations.extraPaymentResults.monthsSaved} months</span>
                      </div>
                    </div>
                  </div>
                )}
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
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{t('monthlyPaymentStat')}</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(calculations.monthlyPayment)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-risk-high" />
                  <span className="text-sm text-muted-foreground">{t('totalInterestStat')}</span>
                </div>
                <p className="text-2xl font-bold text-risk-high">
                  {formatCurrencySimple(calculations.totalInterest)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('loanTermStat')}</span>
                </div>
                <p className="text-2xl font-bold">
                  {Math.floor(termMonths / 12)}y {termMonths % 12}m
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-financial" />
                  <span className="text-sm text-muted-foreground">
                    {calculations.extraPaymentResults ? 'Interest Saved' : 'Total Paid'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-financial">
                  {calculations.extraPaymentResults 
                    ? formatCurrencySimple(calculations.extraPaymentResults.interestSaved)
                    : formatCurrencySimple(calculations.totalPayments)
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Balance Over Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Balance Over Time</CardTitle>
              <CardDescription>
                {calculations.extraPaymentResults 
                  ? 'Comparison of standard payments vs extra payments'
                  : 'How your loan balance decreases over time'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value) => `${Math.floor(value / 12)}y`}
                    />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrencySimple(value),
                        name === 'baseBalance' ? 'Standard Loan Balance' : 'Extra Payment Balance'
                      ]}
                      labelFormatter={(month: number) => `Month ${month}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="baseBalance" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="baseBalance"
                    />
                    {calculations.extraPaymentResults && (
                      <Line 
                        type="monotone" 
                        dataKey="extraBalance" 
                        stroke="hsl(var(--financial))" 
                        strokeWidth={3}
                        name="extraBalance"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Educational Insights */}
          <Card className="border-financial/20 bg-gradient-success/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-financial" />
                  {t('educationalInsights')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">{t('keyLearnings')}:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{t('creditKeyLearnings1')}</li>
                    <li>{t('creditKeyLearnings2')}</li>
                    <li>{t('creditKeyLearnings3')}</li>
                    <li>{t('creditKeyLearnings4')}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t('advancedStrategies')}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{t('debtAvalancheSnowball')}</li>
                    <li>{t('roundUpPayments')}</li>
                    <li>{t('useWindfalls')}</li>
                    <li>{t('balanceDebtEmergency')}</li>
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