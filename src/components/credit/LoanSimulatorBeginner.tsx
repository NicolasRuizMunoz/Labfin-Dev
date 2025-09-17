import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard, DollarSign, Lightbulb, Clock } from 'lucide-react';

export const LoanSimulatorBeginner = () => {
  const [loanAmount, setLoanAmount] = useState(10000);
  const [loanPurpose, setLoanPurpose] = useState<'car' | 'personal' | 'education'>('car');
  const [payoffTime, setPayoffTime] = useState(3);

  const [calculations, setCalculations] = useState<{
    monthlyPayment: number;
    totalInterest: number;
    totalPayments: number;
  } | null>(null);

  const getLoanSettings = (purpose: string) => {
    switch (purpose) {
      case 'car': return { rate: 0.07, name: 'Car Loan', description: 'For buying a vehicle' };
      case 'personal': return { rate: 0.12, name: 'Personal Loan', description: 'For personal expenses' };
      case 'education': return { rate: 0.05, name: 'Student Loan', description: 'For education costs' };
      default: return { rate: 0.08, name: 'Personal Loan', description: 'For personal expenses' };
    }
  };

  const calculateLoan = () => {
    const settings = getLoanSettings(loanPurpose);
    const monthlyRate = settings.rate / 12;
    const numberOfPayments = payoffTime * 12;
    
    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalPayments = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayments - loanAmount;

    setCalculations({
      monthlyPayment,
      totalInterest,
      totalPayments
    });
  };

  useEffect(() => {
    calculateLoan();
  }, [loanAmount, loanPurpose, payoffTime]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const settings = getLoanSettings(loanPurpose);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Your First Loan Calculator! 💳</h3>
              <p className="text-muted-foreground">
                Learn how loans work! This simple calculator shows you how much you'll pay each month and how much 
                extra money (interest) you'll pay for borrowing. Different types of loans have different rates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Your Loan
            </CardTitle>
            <CardDescription>Tell us about the money you want to borrow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loan-amount">How much money do you need?</Label>
              <Input
                id="loan-amount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                min="1000"
                step="1000"
              />
              <p className="text-xs text-muted-foreground">
                💡 This is the total amount you want to borrow
              </p>
            </div>

            <div className="space-y-2">
              <Label>What's the loan for?</Label>
              <Select value={loanPurpose} onValueChange={(value: any) => setLoanPurpose(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">🚗 Car Loan (Lower interest)</SelectItem>
                  <SelectItem value="education">🎓 Education Loan (Lowest interest)</SelectItem>
                  <SelectItem value="personal">💼 Personal Loan (Higher interest)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                💡 Different purposes have different interest rates
              </p>
            </div>

            <div className="space-y-2">
              <Label>How long to pay it back?</Label>
              <Select value={payoffTime.toString()} onValueChange={(value) => setPayoffTime(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 years - Pay faster, less interest</SelectItem>
                  <SelectItem value="3">3 years - Balanced payments</SelectItem>
                  <SelectItem value="5">5 years - Lower payments, more interest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {calculations && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                What You'll Pay
              </CardTitle>
              <CardDescription>Here's what your {settings.name.toLowerCase()} looks like</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(calculations.monthlyPayment)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">You Borrowed</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(loanAmount)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Interest Rate</p>
                    <p className="text-lg font-semibold">
                      {(settings.rate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-risk-high/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Extra Money You'll Pay (Interest)</p>
                  <p className="text-xl font-bold text-risk-high">
                    {formatCurrency(calculations.totalInterest)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 This is the cost of borrowing money
                  </p>
                </div>

                <div className="p-3 bg-financial/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Total You'll Pay Back</p>
                  <p className="text-xl font-bold text-financial">
                    {formatCurrency(calculations.totalPayments)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-financial/20 bg-gradient-success/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-financial" />
            <div>
              <h3 className="font-semibold mb-2">What You Learned About Loans! 🎓</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">💡 Key Things:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Interest is the cost of borrowing money</li>
                    <li>• Different loan types have different rates</li>
                    <li>• Longer loans = lower payments but more interest</li>
                    <li>• Shorter loans = higher payments but less interest</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🎯 Try This:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Change the loan amount and see what happens</li>
                    <li>• Try different loan types</li>
                    <li>• Compare 2 years vs 5 years payoff time</li>
                    <li>• Ready for more? Take the assessment for harder levels!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};