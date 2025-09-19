import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';  
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Home, DollarSign, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const MortgageSimulatorBeginner = () => {
  const { t } = useLanguage();
  const [propertyPrice, setPropertyPrice] = useState(300000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [calculations, setCalculations] = useState<{
    monthlyPayment: number;
    totalInterest: number;
    downPayment: number;
    loanAmount: number;
  } | null>(null);

  const calculateMortgage = () => {
    const downPayment = propertyPrice * (downPaymentPercent / 100);
    const loanAmount = propertyPrice - downPayment;
    const monthlyRate = 0.065 / 12; // Fixed 6.5% rate for simplicity
    const numberOfPayments = loanTermYears * 12;
    
    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalInterest = (monthlyPayment * numberOfPayments) - loanAmount;

    setCalculations({
      monthlyPayment,
      totalInterest,
      downPayment,
      loanAmount
    });
  };

  useEffect(() => {
    calculateMortgage();
  }, [propertyPrice, downPaymentPercent, loanTermYears]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">{t('firstHomeLoan')}</h3>
              <p className="text-muted-foreground">
                {t('learnBasics')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="w-5 h-5" />
              {t('dreamHome')}
            </CardTitle>
            <CardDescription>{t('dreamHomeDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property-price">{t('homePrice')}</Label>
              <Input
                id="property-price"
                type="number"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(Number(e.target.value))}
                min="100000"
                step="10000"
              />
              <p className="text-xs text-muted-foreground">
                💡 {t('homePriceTooltip')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t('downPaymentBeginner')}</Label>
              <Select value={downPaymentPercent.toString()} onValueChange={(value) => setDownPaymentPercent(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">{t('smallDown')}</SelectItem>
                  <SelectItem value="20">{t('goodDown')}</SelectItem>
                  <SelectItem value="30">{t('largeDown')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                💡 {t('downPaymentTooltipBeginner')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t('howLongToPay')}</Label>
              <Select value={loanTermYears.toString()} onValueChange={(value) => setLoanTermYears(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">{t('payFaster')}</SelectItem>
                  <SelectItem value="30">{t('lowerPaymentsTerm')}</SelectItem>
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
              <CardDescription>Here's what your home loan looks like</CardDescription>
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
                    <p className="text-xs text-muted-foreground">Down Payment</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(calculations.downPayment)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Loan Amount</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(calculations.loanAmount)}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-risk-high/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Total Interest You'll Pay</p>
                  <p className="text-xl font-bold text-risk-high">
                    {formatCurrency(calculations.totalInterest)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 This is extra money you pay for borrowing
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
              <h3 className="font-semibold mb-2">What You Learned About Home Loans! 🎓</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">💡 Key Things:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Bigger down payment = smaller monthly payment</li>
                    <li>• Longer loan = smaller monthly payment but more interest</li>
                    <li>• Interest adds up to a lot over many years!</li>
                    <li>• Monthly payment stays the same for the whole loan</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🎯 Try This:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Change the home price and see what happens</li>
                    <li>• Try different down payment amounts</li>
                    <li>• Compare 15 years vs 30 years</li>
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