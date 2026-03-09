export interface ProgramStats {
  programId: string;
  programName: string;
  totalEvaluations: number;
  averageScore: number;
  completionRate: number;
  reactionScore: number;
  learningScore: number;
  behaviorScore: number;
  resultsScore: number;
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
}
