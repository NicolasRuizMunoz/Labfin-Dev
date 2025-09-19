import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Calculator, TrendingDown, Clock } from 'lucide-react';
import { LoanSimulator } from '@/components/credit/LoanSimulator';
import { DifficultyLevelIndicator } from '@/components/DifficultyLevelIndicator';
import { RecommendedDifficultyBadge } from '@/components/RecommendedDifficultyBadge';
import { useLanguage } from '@/contexts/LanguageContext';

const CreditPage = () => {
  const { t } = useLanguage();
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-lg bg-risk-medium/10 mr-3">
            <CreditCard className="w-8 h-8 text-risk-medium" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('creditTitle')}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('creditDescription')}
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
              {t('loanCalculator')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('loanCalculatorDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-financial" />
              {t('extraPaymentImpact')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('extraPaymentImpactDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-risk-medium" />
              {t('amortizationScheduleCredit')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('amortizationScheduleCreditDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Educational Card */}
      <Card className="border-2 border-primary/20 bg-gradient-card mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {t('creditManagementLearning')}
          </CardTitle>
          <CardDescription>
            {t('creditManagementDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-financial">{t('keyConcepts')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {t('conceptsItems').split(', ')[0]}</li>
                <li>• {t('conceptsItems').split(', ')[1]}</li>
                <li>• {t('conceptsItems').split(', ')[2]}</li>
                <li>• {t('conceptsItems').split(', ')[3]}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-risk-medium">{t('smartPaymentStrategies')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {t('strategiesItems').split(', ')[0]}</li>
                <li>• {t('strategiesItems').split(', ')[1]}</li>
                <li>• {t('strategiesItems').split(', ')[2]}</li>
                <li>• {t('strategiesItems').split(', ')[3]}</li>
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