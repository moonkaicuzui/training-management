/**
 * Training Effectiveness Utility
 *
 * Pure functions for measuring training effectiveness by comparing
 * pre-training and post-training quality data (fail rates).
 *
 * Used with AQL/5PRS enrollment logs + training results to evaluate
 * whether training programs actually improved quality outcomes.
 */

// ============================================================
// Types
// ============================================================

export type EffectivenessRating = 'significant' | 'moderate' | 'minimal' | 'none';

export interface QualityDataPoint {
  /** Fail rate as a percentage (0-100) */
  failRate: number;
  /** Period identifier (e.g., '2026-01') */
  period: string;
}

export interface EffectivenessResult {
  /** Employee identifier */
  employeeId: string;
  /** Employee name */
  employeeName: string;
  /** Training program code */
  programCode: string;
  /** Training program name */
  programName: string;
  /** Fail rate before training (%) */
  beforeFailRate: number;
  /** Fail rate after training (%) */
  afterFailRate: number;
  /** Absolute improvement in percentage points */
  improvementPoints: number;
  /** Relative improvement percentage */
  improvementPercent: number;
  /** Effectiveness rating */
  rating: EffectivenessRating;
  /** Date training was enrolled */
  enrolledAt: string;
}

export interface ProgramEffectivenessSummary {
  /** Program code */
  programCode: string;
  /** Program name */
  programName: string;
  /** Number of employees measured */
  employeeCount: number;
  /** Average fail rate before training */
  avgBeforeFailRate: number;
  /** Average fail rate after training */
  avgAfterFailRate: number;
  /** Average improvement in percentage points */
  avgImprovementPoints: number;
  /** Average relative improvement percentage */
  avgImprovementPercent: number;
  /** Overall effectiveness rating */
  rating: EffectivenessRating;
  /** Distribution of ratings */
  ratingDistribution: Record<EffectivenessRating, number>;
}

/** Data shape for before/after comparison chart (Recharts compatible) */
export interface EffectivenessChartData {
  programName: string;
  programCode: string;
  before: number;
  after: number;
  improvement: number;
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Calculate effectiveness by comparing before and after fail rates.
 *
 * @param beforeFailRate - Fail rate before training (0-100)
 * @param afterFailRate - Fail rate after training (0-100)
 * @returns Object with improvement metrics
 */
export function calculateEffectiveness(
  beforeFailRate: number,
  afterFailRate: number
): { improvementPoints: number; improvementPercent: number; rating: EffectivenessRating } {
  const improvementPoints = beforeFailRate - afterFailRate;

  // Avoid division by zero: if beforeFailRate is 0, no improvement is possible
  const improvementPercent =
    beforeFailRate > 0
      ? (improvementPoints / beforeFailRate) * 100
      : 0;

  const rating = getEffectivenessRating(improvementPercent);

  return {
    improvementPoints: Math.round(improvementPoints * 100) / 100,
    improvementPercent: Math.round(improvementPercent * 100) / 100,
    rating,
  };
}

/**
 * Determine effectiveness rating based on relative improvement percentage.
 *
 * - significant: >50% improvement
 * - moderate: 20-50% improvement
 * - minimal: 1-20% improvement
 * - none: 0% or worse (no improvement / degradation)
 *
 * @param improvementPercent - Relative improvement percentage
 * @returns EffectivenessRating
 */
export function getEffectivenessRating(improvementPercent: number): EffectivenessRating {
  if (improvementPercent > 50) return 'significant';
  if (improvementPercent >= 20) return 'moderate';
  if (improvementPercent > 0) return 'minimal';
  return 'none';
}

/**
 * Summarize effectiveness across multiple employees for a single program.
 *
 * @param results - Array of individual effectiveness results
 * @returns ProgramEffectivenessSummary
 */
export function summarizeProgramEffectiveness(
  results: EffectivenessResult[]
): ProgramEffectivenessSummary | null {
  if (results.length === 0) return null;

  const first = results[0];

  const totalBefore = results.reduce((sum, r) => sum + r.beforeFailRate, 0);
  const totalAfter = results.reduce((sum, r) => sum + r.afterFailRate, 0);
  const totalImprovementPoints = results.reduce((sum, r) => sum + r.improvementPoints, 0);
  const totalImprovementPercent = results.reduce((sum, r) => sum + r.improvementPercent, 0);

  const count = results.length;
  const avgImprovementPercent = totalImprovementPercent / count;

  const ratingDistribution: Record<EffectivenessRating, number> = {
    significant: 0,
    moderate: 0,
    minimal: 0,
    none: 0,
  };

  for (const r of results) {
    ratingDistribution[r.rating]++;
  }

  return {
    programCode: first.programCode,
    programName: first.programName,
    employeeCount: count,
    avgBeforeFailRate: Math.round((totalBefore / count) * 100) / 100,
    avgAfterFailRate: Math.round((totalAfter / count) * 100) / 100,
    avgImprovementPoints: Math.round((totalImprovementPoints / count) * 100) / 100,
    avgImprovementPercent: Math.round(avgImprovementPercent * 100) / 100,
    rating: getEffectivenessRating(avgImprovementPercent),
    ratingDistribution,
  };
}

/**
 * Group effectiveness results by program and summarize each.
 *
 * @param results - Array of individual effectiveness results
 * @returns Array of ProgramEffectivenessSummary
 */
export function summarizeByProgram(
  results: EffectivenessResult[]
): ProgramEffectivenessSummary[] {
  const grouped = new Map<string, EffectivenessResult[]>();

  for (const r of results) {
    const existing = grouped.get(r.programCode) || [];
    existing.push(r);
    grouped.set(r.programCode, existing);
  }

  const summaries: ProgramEffectivenessSummary[] = [];
  for (const [, group] of grouped) {
    const summary = summarizeProgramEffectiveness(group);
    if (summary) {
      summaries.push(summary);
    }
  }

  return summaries.sort((a, b) => b.avgImprovementPercent - a.avgImprovementPercent);
}

/**
 * Convert program summaries to Recharts-compatible chart data.
 *
 * @param summaries - Array of ProgramEffectivenessSummary
 * @returns Array of EffectivenessChartData
 */
export function toChartData(
  summaries: ProgramEffectivenessSummary[]
): EffectivenessChartData[] {
  return summaries.map((s) => ({
    programName: s.programName,
    programCode: s.programCode,
    before: s.avgBeforeFailRate,
    after: s.avgAfterFailRate,
    improvement: s.avgImprovementPoints,
  }));
}

/**
 * Get color for effectiveness rating (Tailwind classes).
 *
 * @param rating - EffectivenessRating
 * @returns Tailwind text color class
 */
export function getRatingColor(rating: EffectivenessRating): string {
  switch (rating) {
    case 'significant':
      return 'text-green-600';
    case 'moderate':
      return 'text-blue-600';
    case 'minimal':
      return 'text-yellow-600';
    case 'none':
      return 'text-red-600';
  }
}

/**
 * Get badge variant for effectiveness rating.
 *
 * @param rating - EffectivenessRating
 * @returns Badge variant string
 */
export function getRatingBadgeVariant(
  rating: EffectivenessRating
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (rating) {
    case 'significant':
      return 'default';
    case 'moderate':
      return 'secondary';
    case 'minimal':
      return 'outline';
    case 'none':
      return 'destructive';
  }
}
