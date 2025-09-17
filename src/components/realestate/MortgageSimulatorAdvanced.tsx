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
            <CardTitle className="text-lg">Property Details</CardTitle>
            <CardDescription>Configure the property and loan terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="property-price">Property Price</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">The total purchase price of the property. This determines your loan amount based on your down payment percentage.</p>
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
                <Label htmlFor="down-payment">Down Payment (%)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">The upfront payment you make when buying the home. Higher down payments reduce your loan amount and may help you avoid PMI (Private Mortgage Insurance).</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={downPaymentPercent.toString()} onValueChange={(value) => setDownPaymentPercent(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5% - Minimum down payment</SelectItem>
                  <SelectItem value="10">10% - Low down payment</SelectItem>
                  <SelectItem value="20">20% - Avoid PMI</SelectItem>
                  <SelectItem value="25">25% - Better rates</SelectItem>
                  <SelectItem value="30">30% - Lower payments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">The annual percentage rate charged by the lender. Even small changes (0.5-1%) can significantly impact your monthly payment and total interest paid over the loan term.</p>
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
              <Label htmlFor="loan-term">Loan Term</Label>
              <Select value={loanTermYears.toString()} onValueChange={(value) => setLoanTermYears(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 years - Higher payments, less interest</SelectItem>
                  <SelectItem value="20">20 years - Balanced approach</SelectItem>
                  <SelectItem value="30">30 years - Lower payments, more interest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Costs</CardTitle>
            <CardDescription>Annual property tax and insurance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property-tax">Annual Property Tax</Label>
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
              <Label htmlFor="insurance">Annual Insurance</Label>
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
                <h4 className="font-semibold mb-2">Quick Overview</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Down Payment:</span>
                    <span className="font-medium">{formatCurrency(calculations.downPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan Amount:</span>
                    <span className="font-medium">{formatCurrency(calculations.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly P&I:</span>
                    <span className="font-medium">{formatCurrency(calculations.monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax & Insurance:</span>
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
                  <span className="text-sm text-muted-foreground">Total Monthly</span>
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
                  <span className="text-sm text-muted-foreground">P&I Payment</span>
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
                  <span className="text-sm text-muted-foreground">Total Interest</span>
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
                  <span className="text-sm text-muted-foreground">Total Paid</span>
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
              <CardTitle>Equity Building Over Time</CardTitle>
              <CardDescription>
                How your home equity grows as you pay down the mortgage
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
                        name === 'equity' ? 'Home Equity' : 'Remaining Balance'
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
                  <CardTitle>Amortization Schedule</CardTitle>
                  <CardDescription>
                    Detailed month-by-month breakdown of your payments
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAmortization(!showAmortization)}
                >
                  {showAmortization ? 'Hide' : 'Show'} Schedule
                </Button>
              </div>
            </CardHeader>
            {showAmortization && (
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Equity</TableHead>
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
                      Showing first 60 months of {calculations.amortizationSchedule.length} total payments
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
                Educational Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Key Learnings:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Early payments are mostly interest, later payments are mostly principal</li>
                    <li>• Interest rate changes have significant impact on total cost</li>
                    <li>• Larger down payments reduce PMI and monthly payments</li>
                    <li>• Property taxes and insurance add to your monthly housing cost</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Advanced Strategies:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Extra principal payments can save years and thousands in interest</li>
                    <li>• Bi-weekly payments result in 13 monthly payments per year</li>
                    <li>• Refinancing when rates drop can reduce total costs</li>
                    <li>• Consider the opportunity cost of large down payments</li>
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