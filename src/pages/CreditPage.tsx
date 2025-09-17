import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Calculator, TrendingDown, Clock } from 'lucide-react';
import { LoanSimulator } from '@/components/credit/LoanSimulator';
import { DifficultyLevelIndicator } from '@/components/DifficultyLevelIndicator';
import { RecommendedDifficultyBadge } from '@/components/RecommendedDifficultyBadge';

const CreditPage = () => {
  return (
    <div className="container max-w-6xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-lg bg-risk-medium/10 mr-3">
            <CreditCard className="w-8 h-8 text-risk-medium" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Credit & Loan Simulator
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Understand loan amortization, interest calculations, and payment optimization strategies
        </p>
        <div className="flex justify-center mt-4">
          <RecommendedDifficultyBadge module="Credit & Loans" />
        </div>
      </div>

      <DifficultyLevelIndicator />

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">{/* rest stays same */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Loan Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Calculate monthly payments, total interest, and see how different terms affect your loan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-financial" />
              Extra Payment Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              See how extra monthly payments can save thousands in interest and shorten loan terms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-risk-medium" />
              Amortization Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Detailed month-by-month breakdown of principal vs interest payments over time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Educational Card */}
      <Card className="border-2 border-primary/20 bg-gradient-card mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Credit Management Learning
          </CardTitle>
          <CardDescription>
            Master the fundamentals of loan management and interest optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-financial">Key Concepts You'll Learn:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• How interest is calculated and compounded</li>
                <li>• The impact of loan term length on total cost</li>
                <li>• Principal vs interest payment allocation</li>
                <li>• Strategies for early loan payoff</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-risk-medium">Smart Payment Strategies:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Make bi-weekly payments instead of monthly</li>
                <li>• Apply windfalls directly to principal</li>
                <li>• Consider refinancing when rates drop</li>
                <li>• Pay high-interest debt first (avalanche method)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Simulator */}
      <LoanSimulator />
    </div>
  );
};

export default CreditPage;