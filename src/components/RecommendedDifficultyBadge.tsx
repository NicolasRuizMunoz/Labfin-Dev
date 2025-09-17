import { Badge } from '@/components/ui/badge';
import { getDifficultyLevel, getDifficultyDisplayName } from '@/lib/difficultyLevel';
import { CheckCircle2, AlertTriangle, Target } from 'lucide-react';

interface RecommendedDifficultyBadgeProps {
  module?: string;
  showIcon?: boolean;
}

export const RecommendedDifficultyBadge = ({ module, showIcon = true }: RecommendedDifficultyBadgeProps) => {
  const recommendedLevel = getDifficultyLevel();
  const hasAssessment = localStorage.getItem('userAssessment') !== null;
  
  // If no assessment taken, show encouragement to take assessment
  if (!hasAssessment) {
    return (
      <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">
        {showIcon && <AlertTriangle className="w-3 h-3 mr-1" />}
        Take Assessment
      </Badge>
    );
  }

  const getIcon = () => {
    if (!showIcon) return null;
    switch (recommendedLevel) {
      case 'beginner':
        return <Target className="w-3 h-3 mr-1" />;
      case 'medium':
        return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'advanced':
        return <CheckCircle2 className="w-3 h-3 mr-1" />;
      default:
        return <Target className="w-3 h-3 mr-1" />;
    }
  };

  const getBadgeVariant = () => {
    switch (recommendedLevel) {
      case 'beginner':
        return 'outline border-green-500 text-green-700 bg-green-50';
      case 'medium':
        return 'outline border-blue-500 text-blue-700 bg-blue-50';
      case 'advanced':
        return 'outline border-purple-500 text-purple-700 bg-purple-50';
      default:
        return 'outline';
    }
  };

  return (
    <Badge className={getBadgeVariant()}>
      {getIcon()}
      Recommended: {getDifficultyDisplayName(recommendedLevel)}
    </Badge>
  );
};