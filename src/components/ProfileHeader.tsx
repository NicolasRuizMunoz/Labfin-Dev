import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  TrendingUp, 
  Users, 
  ChevronDown, 
  Target, 
  Lightbulb, 
  Award,
  Clock,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getDifficultyLevel } from '@/lib/difficultyLevel';

interface UserStats {
  friendsCount: number;
  testResultsCount: number;
  averageScore: number;
  lastTestDate: string | null;
}

interface AssessmentResult {
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
  timeHorizon: string;
  primaryGoal: string;
  assetPreference: string;
  incomeStability: string;
  score: number;
  completedAt: string;
}

export const ProfileHeader = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    friendsCount: 0,
    testResultsCount: 0,
    averageScore: 0,
    lastTestDate: null
  });
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    if (user) {
      loadUserStats();
      loadAssessment();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;

    try {
      // Get friends count
      const { data: friendsData } = await supabase
        .from('friendships')
        .select('id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      // Get test results
      const { data: testData } = await supabase
        .from('test_results')
        .select('score, completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      const friendsCount = friendsData?.length || 0;
      const testResultsCount = testData?.length || 0;
      const averageScore = testData?.length 
        ? Math.round(testData.reduce((sum, test) => sum + test.score, 0) / testData.length)
        : 0;
      const lastTestDate = testData?.[0]?.completed_at || null;

      setUserStats({
        friendsCount,
        testResultsCount,
        averageScore,
        lastTestDate
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadAssessment = () => {
    try {
      const storedAssessment = localStorage.getItem('userAssessment');
      if (storedAssessment) {
        setAssessment(JSON.parse(storedAssessment));
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
    }
  };

  const getRiskProfileColor = (profile: string) => {
    switch (profile) {
      case 'Conservative':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Moderate':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Aggressive':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPersonalizedTips = () => {
    if (!assessment) return [];

    const difficulty = getDifficultyLevel();
    const tips = [];

    if (assessment.riskProfile === 'Conservative') {
      tips.push({
        icon: Target,
        text: t('conservativeTip')
      });
    } else if (assessment.riskProfile === 'Moderate') {
      tips.push({
        icon: BarChart3,
        text: t('moderateTip')
      });
    } else {
      tips.push({
        icon: TrendingUp,
        text: t('aggressiveTip')
      });
    }

    if (difficulty === 'beginner') {
      tips.push({
        icon: Lightbulb,
        text: t('beginnerTip')
      });
    }

    if (userStats.testResultsCount < 5) {
      tips.push({
        icon: Award,
        text: t('practiceMoreTip')
      });
    }

    return tips;
  };

  if (!user) return null;

  return (
    <div className="w-full border-b border-border/40 bg-background/95 backdrop-blur">
      <div className="container max-w-7xl mx-auto px-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full py-4 px-0 h-auto hover:bg-transparent"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-foreground">
                      {user.user_metadata?.display_name || user.email?.split('@')[0] || t('user')}
                    </span>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {userStats.friendsCount} {t('friendsCount')}
                      </span>
                      {assessment && (
                        <Badge className={`text-xs ${getRiskProfileColor(assessment.riskProfile)}`}>
                          {t(assessment.riskProfile.toLowerCase())}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Assessment Results */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    {t('yourProfile')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assessment ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {assessment.score}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('riskScore')}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {t(assessment.riskProfile.toLowerCase())}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('riskProfile')}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {t(assessment.timeHorizon)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('timeHorizon')}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {t(assessment.primaryGoal)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('primaryGoal')}
                          </div>
                        </div>
                      </div>
                      
                      {userStats.testResultsCount > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-primary">
                                {userStats.averageScore}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {t('avgScore')}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold">
                                {userStats.testResultsCount}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {t('testsCompleted')}
                              </div>
                            </div>
                          </div>
                          {userStats.lastTestDate && (
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">
                                {t('lastTest')}
                              </div>
                              <div className="text-sm">
                                {new Date(userStats.lastTestDate).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Target className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground mb-2">{t('noAssessment')}</p>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/assessment">{t('takeAssessment')}</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tips & Feedback */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    {t('personalizedTips')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getPersonalizedTips().length > 0 ? (
                    <div className="space-y-3">
                      {getPersonalizedTips().map((tip, index) => {
                        const Icon = tip.icon;
                        return (
                          <div key={index} className="flex items-start space-x-2">
                            <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">{tip.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {t('completeAssessmentForTips')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default ProfileHeader;