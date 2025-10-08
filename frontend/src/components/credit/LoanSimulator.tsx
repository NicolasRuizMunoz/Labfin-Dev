import { getDifficultyLevel } from '@/lib/difficultyLevel';
import { LoanSimulatorBeginner } from './LoanSimulatorBeginner';
import { LoanSimulatorAdvanced } from './LoanSimulatorAdvanced';

export const LoanSimulator = () => {
  const difficultyLevel = getDifficultyLevel();

  switch (difficultyLevel) {
    case 'beginner':
      return <LoanSimulatorBeginner />;
    case 'medium':
      return <LoanSimulatorAdvanced />; // Use advanced for medium until we create medium version
    case 'advanced':
    default:
      return <LoanSimulatorAdvanced />;
  }
};