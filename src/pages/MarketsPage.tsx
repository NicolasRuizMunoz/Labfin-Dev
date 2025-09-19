import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Play, BarChart3, Zap } from 'lucide-react';
import { MarketSimulator } from '@/components/markets/MarketSimulator';
import { LiveEventGame } from '@/components/markets/LiveEventGame';
import { DifficultyLevelIndicator } from '@/components/DifficultyLevelIndicator';
import { RecommendedDifficultyBadge } from '@/components/RecommendedDifficultyBadge';
import { useLanguage } from '@/contexts/LanguageContext';

const MarketsPage = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('simulator');

  return (
    <div className="container max-w-6xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-lg bg-primary/10 mr-3">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('marketsTitle')}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('marketsDescription')}
        </p>
        <div className="flex justify-center mt-4">
          <RecommendedDifficultyBadge module="Markets" />
        </div>
      </div>

      <DifficultyLevelIndicator />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {t('marketSimulator')}
          </TabsTrigger>
          <TabsTrigger value="live-events" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {t('liveEventGame')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulator" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-financial"></div>
                  {t('portfolioGrowth')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('portfolioGrowthDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-risk-medium"></div>
                  {t('riskAnalysis')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('riskAnalysisDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  {t('educationalInsights')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('educationalInsightsDesc')}
                </p>
              </CardContent>
            </Card>
          </div>

          <MarketSimulator />
        </TabsContent>

        <TabsContent value="live-events" className="space-y-6">
          <Card className="border-2 border-primary/20 bg-gradient-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    {t('liveEventPortfolioGame')}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {t('liveEventDescription')}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                  {t('interactive')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <h4 className="font-semibold text-financial mb-1">{t('realEvents')}</h4>
                  <p className="text-sm text-muted-foreground">{t('realEventsDesc')}</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-risk-medium mb-1">{t('quickDecisions')}</h4>
                  <p className="text-sm text-muted-foreground">{t('quickDecisionsDesc')}</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-primary mb-1">{t('learnImprove')}</h4>
                  <p className="text-sm text-muted-foreground">{t('learnImproveDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <LiveEventGame />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketsPage;