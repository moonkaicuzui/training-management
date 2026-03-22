/**
 * HR V2 연계 분석 서비스
 *
 * 6가지 분석 기능을 하위 모듈로 분할하여 re-export합니다.
 * 기존 import 경로 호환성을 유지합니다.
 */

// 타입 re-export
export type {
  TrainingEffectivenessResult,
  RiskBasedRecommendation,
  NewHireTrainingStatus,
  QualitySync,
  DepartmentTrainingRate,
  TurnoverTrainingCorrelation,
} from './hrAnalytics/types';

// 함수 re-export
export { analyzeTrainingEffectiveness } from './hrAnalytics/effectiveness';
export { getHighRiskTrainingRecommendations } from './hrAnalytics/risk';
export { getNewHireTrainingStatus } from './hrAnalytics/newHire';
export { compareQualityData } from './hrAnalytics/quality';
export { getDepartmentTrainingRates } from './hrAnalytics/department';
export { analyzeTurnoverTrainingCorrelation } from './hrAnalytics/turnover';
