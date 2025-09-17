export type DifficultyLevel = 'beginner' | 'medium' | 'advanced';

interface AssessmentResult {
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
  score: number;
}

export const getDifficultyLevel = (): DifficultyLevel => {
  try {
    const assessment = localStorage.getItem('userAssessment');
    if (!assessment) return 'advanced'; // Default to advanced if no assessment
    
    const result: AssessmentResult = JSON.parse(assessment);
    
    // Map risk profile to difficulty level
    switch (result.riskProfile) {
      case 'Conservative':
        return 'beginner';
      case 'Moderate':
        return 'medium';
      case 'Aggressive':
        return 'advanced';
      default:
        return 'advanced';
    }
  } catch (error) {
    console.error('Error reading assessment from localStorage:', error);
    return 'advanced'; // Default fallback
  }
};

export const getDifficultyDisplayName = (level: DifficultyLevel): string => {
  switch (level) {
    case 'beginner':
      return 'Beginner';
    case 'medium':
      return 'Medium';
    case 'advanced':
      return 'Advanced';
    default:
      return 'Advanced';
  }
};

export const getDifficultyDescription = (level: DifficultyLevel): string => {
  switch (level) {
    case 'beginner':
      return 'Simplified interface with basic concepts and guided explanations';
    case 'medium':
      return 'Balanced approach with some advanced features and moderate complexity';
    case 'advanced':
      return 'Full feature set with detailed analysis and comprehensive options';
    default:
      return 'Full feature set with detailed analysis and comprehensive options';
  }
};