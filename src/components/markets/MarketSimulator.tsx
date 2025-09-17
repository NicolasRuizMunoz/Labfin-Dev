import { getDifficultyLevel } from '@/lib/difficultyLevel';
import { MarketSimulatorBeginner } from './MarketSimulatorBeginner';
import { MarketSimulatorMedium } from './MarketSimulatorMedium';
import { MarketSimulatorAdvanced } from './MarketSimulatorAdvanced';

export const MarketSimulator = () => {
  const difficultyLevel = getDifficultyLevel();

  switch (difficultyLevel) {
    case 'beginner':
      return <MarketSimulatorBeginner />;
    case 'medium':
      return <MarketSimulatorMedium />;
    case 'advanced':
    default:
      return <MarketSimulatorAdvanced />;
  }
};