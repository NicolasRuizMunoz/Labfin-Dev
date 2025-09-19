import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Building2, Calculator } from 'lucide-react';
import { MortgageSimulator } from '@/components/realestate/MortgageSimulator';
import { RentalSimulator } from '@/components/realestate/RentalSimulator';
import { DifficultyLevelIndicator } from '@/components/DifficultyLevelIndicator';
import { RecommendedDifficultyBadge } from '@/components/RecommendedDifficultyBadge';
import { useLanguage } from '@/contexts/LanguageContext';

const RealEstatePage = () => {
  const { t } = useLanguage();
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
            {t('realEstateTitle')}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('realEstateDescription')}
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
            {t('primaryHomeMortgage')}
          </TabsTrigger>
          <TabsTrigger value="rental" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {t('rentalInvestment')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mortgage" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  {t('monthlyPayments')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('monthlyPaymentsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-financial"></div>
                  {t('amortizationSchedule')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('amortizationScheduleDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-risk-medium"></div>
                  {t('totalCostAnalysis')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('totalCostAnalysisDesc')}
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
                    {t('rentalPropertyInvestment')}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {t('rentalPropertyDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <h4 className="font-semibold text-financial mb-1">{t('cashFlowAnalysis')}</h4>
                  <p className="text-sm text-muted-foreground">{t('cashFlowAnalysisDesc')}</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-risk-medium mb-1">{t('marketEvents')}</h4>
                  <p className="text-sm text-muted-foreground">{t('marketEventsDesc')}</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-primary mb-1">{t('roiMetrics')}</h4>
                  <p className="text-sm text-muted-foreground">{t('roiMetricsDesc')}</p>
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