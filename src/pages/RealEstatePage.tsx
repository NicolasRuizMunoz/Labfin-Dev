import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Building2, Calculator } from 'lucide-react';
import { MortgageSimulator } from '@/components/realestate/MortgageSimulator';
import { RentalSimulator } from '@/components/realestate/RentalSimulator';
import { DifficultyLevelIndicator } from '@/components/DifficultyLevelIndicator';
import { RecommendedDifficultyBadge } from '@/components/RecommendedDifficultyBadge';

const RealEstatePage = () => {
  const [activeTab, setActiveTab] = useState('mortgage');

  return (
    <div className="container max-w-6xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-lg bg-financial/10 mr-3">
            <Home className="w-8 h-8 text-financial" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Real Estate Simulator
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore mortgage calculations for home buying and rental property investment scenarios
        </p>
        <div className="flex justify-center mt-4">
          <RecommendedDifficultyBadge module="Real Estate" />
        </div>
      </div>

      <DifficultyLevelIndicator />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="mortgage" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Primary Home Mortgage
          </TabsTrigger>
          <TabsTrigger value="rental" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Rental Investment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mortgage" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Monthly Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Calculate exact monthly payments based on price, down payment, and interest rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-financial"></div>
                  Amortization Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  See how much goes to principal vs interest over time and track equity building
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-risk-medium"></div>
                  Total Cost Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Understand the total interest paid and how different terms affect overall cost
                </p>
              </CardContent>
            </Card>
          </div>

          <MortgageSimulator />
        </TabsContent>

        <TabsContent value="rental" className="space-y-6">
          <Card className="border-2 border-financial/20 bg-gradient-success/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-financial" />
                    Rental Property Investment
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Analyze rental property investments with cap rates, cash flow, and appreciation scenarios
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <h4 className="font-semibold text-financial mb-1">Cash Flow Analysis</h4>
                  <p className="text-sm text-muted-foreground">Monthly rent vs expenses</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-risk-medium mb-1">Market Events</h4>
                  <p className="text-sm text-muted-foreground">Economic factors affecting returns</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-primary mb-1">ROI Metrics</h4>
                  <p className="text-sm text-muted-foreground">Cap rate, IRR, and total returns</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <RentalSimulator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealEstatePage;