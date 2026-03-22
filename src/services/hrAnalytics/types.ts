/** 시나리오 1: 교육 효과 측정 */
export interface TrainingEffectivenessResult {
  employeeId: string;
  employeeName: string;
  programCode: string;
  trainingDate: string;
  beforeMetrics: { aqlPassRate?: number; fivePrsPassRate?: number; riskScore?: number };
  afterMetrics: { aqlPassRate?: number; fivePrsPassRate?: number; riskScore?: number };
  improvement: { aqlChange?: number; fivePrsChange?: number; riskChange?: number };
}

/** 시나리오 2: 위험 직원 교육 추천 */
export interface RiskBasedRecommendation {
  employeeId: string;
  employeeName: string;
  team: string;
  building: string;
  riskScore: number;
  riskLevel: string;
  riskFactors: string[];
  recommendedPrograms: string[];
  currentTrainingStatus: 'none' | 'in_progress' | 'completed';
}

/** 시나리오 3: 신입 교육 현황 */
export interface NewHireTrainingStatus {
  employeeId: string;
  employeeName: string;
  hireDate: string;
  team: string;
  building: string;
  daysEmployed: number;
  tqcStatus: 'not_enrolled' | 'in_training' | 'completed' | 'failed';
  tqcEnrollDate?: string;
  requiredPrograms: string[];
  completedPrograms: string[];
  completionRate: number;
}

/** 시나리오 4: 품질 데이터 비교 */
export interface QualitySync {
  employeeId: string;
  employeeName: string;
  qtrain: { aqlFailRate?: number; fivePrsFailRate?: number; inspectionGrade?: string };
  hrV2: { aqlPassRate?: number; fivePrsPassRate?: number; qualityGrade?: string };
  discrepancy: boolean;
  lastSynced?: string;
}

/** 시나리오 5: 부서별 교육 완료율 */
export interface DepartmentTrainingRate {
  department: string;
  totalEmployees: number;
  activeEmployees: number;
  requiredPrograms: number;
  completedPrograms: number;
  completionRate: number;
  avgScore: number;
  passRate: number;
  topPerformers: string[];
  needsAttention: string[];
}

/** 시나리오 6: 이직률 ↔ 교육 상관관계 */
export interface TurnoverTrainingCorrelation {
  period: string;
  totalResignations: number;
  resignedWithTraining: number;
  resignedWithoutTraining: number;
  trainingRetentionRate: number;
  noTrainingRetentionRate: number;
  tqcCompletionSurvivalRate: number;
  avgTrainingHoursResigned: number;
  avgTrainingHoursRetained: number;
}
