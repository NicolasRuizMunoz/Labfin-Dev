import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Settings } from 'lucide-react';
import { getDifficultyLevel, getDifficultyDisplayName, getDifficultyDescription } from '@/lib/difficultyLevel';
import type { DifficultyLevel } from '@/lib/difficultyLevel';
import { useLanguage } from '@/contexts/LanguageContext';

interface DifficultyLevelIndicatorProps {
  onLevelChange?: () => void;
}

export const DifficultyLevelIndicator = ({ onLevelChange }: DifficultyLevelIndicatorProps) => {
  const { t } = useLanguage();
  const [currentLevel, setCurrentLevel] = useState<DifficultyLevel>(getDifficultyLevel());
  const [showSettings, setShowSettings] = useState(false);

  const handleLevelChange = (newLevel: DifficultyLevel) => {
    // Create a mock assessment result based on selected difficulty
    const mockAssessment = {
      riskProfile: newLevel === 'beginner' ? 'Conservative' as const : 
                   newLevel === 'medium' ? 'Moderate' as const : 'Aggressive' as const,
      timeHorizon: 'Flexible',
      primaryGoal: 'Learning',
      assetPreference: 'Balanced',
      incomeStability: 'Stable',
      score: newLevel === 'beginner' ? 1.5 : newLevel === 'medium' ? 2.0 : 2.5,
      completedAt: new Date().toISOString()
    };

    localStorage.setItem('userAssessment', JSON.stringify(mockAssessment));
    setCurrentLevel(newLevel);
    setShowSettings(false);
    
    // Refresh the page to apply new difficulty level
    window.location.reload();
  };

  const hasAssessment = localStorage.getItem('userAssessment') !== null;

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{t('learningLevel')}:</span>
              <Badge variant="outline" className="border-primary text-primary">
                {t(currentLevel)}
              </Badge>
            </div>
            
            {!hasAssessment && (
              <div className="text-xs text-muted-foreground">
                ({t('defaultLevel')} - {t('takeAssessmentPersonalized')})
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!showSettings ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-8"
              >
                <Settings className="w-3 h-3 mr-1" />
                {t('changeLevel')}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={currentLevel} onValueChange={handleLevelChange}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t('beginner')}</SelectItem>
                    <SelectItem value="medium">{t('medium')}</SelectItem>
                    <SelectItem value="advanced">{t('advanced')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="h-8 px-2"
                >
                  {t('cancel')}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {showSettings && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Current:</strong> {getDifficultyDescription(currentLevel)}
            </p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p><strong>Beginner:</strong> Simple interface with basic concepts and step-by-step guidance</p>
              <p><strong>Medium:</strong> Balanced complexity with some advanced features</p>
              <p><strong>Advanced:</strong> Full feature set with detailed analysis and all options</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};