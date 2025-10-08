import { getDifficultyLevel } from '@/lib/difficultyLevel';
import { MortgageSimulatorBeginner } from './MortgageSimulatorBeginner';
import { MortgageSimulatorAdvanced } from './MortgageSimulatorAdvanced';

export const MortgageSimulator = () => {
  const difficultyLevel = getDifficultyLevel();

  switch (difficultyLevel) {
    case 'beginner':
      return <MortgageSimulatorBeginner />;
    case 'medium':
      return <MortgageSimulatorAdvanced />; // Use advanced for medium until we create medium version
    case 'advanced':
    default:
      return <MortgageSimulatorAdvanced />;
  }
};