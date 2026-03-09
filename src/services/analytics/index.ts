/**
 * Analytics Module
 *
 * Re-exports all analytics functions and types from sub-modules.
 */

// Types and shared utilities
export type {
  AnalyticsMetrics,
  CompetencyGapAnalysis,
  ROIAnalysis,
  TrendData,
  DepartmentComparison,
} from './shared';

export { clearAnalyticsCache } from './shared';

// Dashboard analytics
export { getLatestMetrics, getHistoricalMetrics } from './dashboardAnalytics';

// Quality analytics (competency gaps, ROI)
export { calculateCompetencyGaps, calculateROI } from './qualityAnalytics';

// Training analytics (trends, department comparison)
export { getTrainingTrends, getDepartmentComparison } from './trainingAnalytics';
