// ============================================================
// Q-TRAIN API - HR Analytics Wrapper
// ============================================================

import {
  analyzeTrainingEffectiveness as _analyzeTrainingEffectiveness,
  getHighRiskTrainingRecommendations as _getHighRiskTrainingRecommendations,
  getNewHireTrainingStatus as _getNewHireTrainingStatus,
  compareQualityData as _compareQualityData,
  getDepartmentTrainingRates as _getDepartmentTrainingRates,
  analyzeTurnoverTrainingCorrelation as _analyzeTurnoverTrainingCorrelation,
} from '@/services/hrAnalyticsService';

// Re-export types for convenience
export type {
  TrainingEffectivenessResult,
  RiskBasedRecommendation,
  NewHireTrainingStatus,
  QualitySync,
  DepartmentTrainingRate,
  TurnoverTrainingCorrelation,
} from '@/services/hrAnalyticsService';

export const analyzeTrainingEffectiveness = _analyzeTrainingEffectiveness;
export const getHighRiskTrainingRecommendations = _getHighRiskTrainingRecommendations;
export const getNewHireTrainingStatus = _getNewHireTrainingStatus;
export const compareQualityData = _compareQualityData;
export const getDepartmentTrainingRates = _getDepartmentTrainingRates;
export const analyzeTurnoverTrainingCorrelation = _analyzeTurnoverTrainingCorrelation;
