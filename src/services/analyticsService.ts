/**
 * Analytics Pipeline Service
 *
 * Re-exports from split analytics modules for backward compatibility.
 * See src/services/analytics/ for the actual implementations:
 * - dashboardAnalytics.ts: getLatestMetrics, getHistoricalMetrics
 * - qualityAnalytics.ts: calculateCompetencyGaps, calculateROI
 * - trainingAnalytics.ts: getTrainingTrends, getDepartmentComparison
 * - shared.ts: types, cache, helpers, doc parsers
 */

export type {
  AnalyticsMetrics,
  CompetencyGapAnalysis,
  ROIAnalysis,
  TrendData,
  DepartmentComparison,
} from './analytics';

export {
  clearAnalyticsCache,
  getLatestMetrics,
  getHistoricalMetrics,
  calculateCompetencyGaps,
  calculateROI,
  getTrainingTrends,
  getDepartmentComparison,
} from './analytics';
