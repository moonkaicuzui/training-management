/**
 * KPI Anomaly Detector
 *
 * Statistical anomaly detection using 6-month moving average + standard deviation.
 * Compares current KPI values against historical snapshots to identify
 * significant deviations that may require attention.
 *
 * Algorithm:
 *   1. For each KPI field, compute mean and stdDev from historical snapshots
 *   2. Calculate deviation = (currentValue - mean) / stdDev
 *   3. |deviation| > 2.0 => CRITICAL, > 1.5 => WARNING
 *   4. Direction and positivity depend on field-specific semantics
 */

import type { KPISnapshot } from '@/services/kpiSnapshotService';

// ============================================================
// Types
// ============================================================

export type AnomalySeverity = 'WARNING' | 'CRITICAL';
export type AnomalyDirection = 'UP' | 'DOWN';

export interface KPIAnomaly {
  /** The KPI field key (e.g., 'passRate') */
  field: string;
  /** Human-readable label for the field */
  fieldLabel: string;
  /** The current value being compared */
  currentValue: number;
  /** Historical mean from snapshots */
  mean: number;
  /** Historical standard deviation */
  stdDev: number;
  /** Number of standard deviations from the mean */
  deviation: number;
  /** Severity based on deviation magnitude */
  severity: AnomalySeverity;
  /** Whether the value went UP or DOWN from the mean */
  direction: AnomalyDirection;
  /** Whether this deviation is a positive signal (e.g., higher pass rate = good) */
  isPositive: boolean;
}

// ============================================================
// Field Configuration
// ============================================================

interface KPIFieldConfig {
  key: string;
  label: string;
  /** If true, higher values are better. If false, lower values are better. */
  higherIsBetter: boolean;
}

const KPI_FIELDS: KPIFieldConfig[] = [
  { key: 'overallCompletionRate', label: 'Overall Completion Rate', higherIsBetter: true },
  { key: 'passRate', label: 'Pass Rate', higherIsBetter: true },
  { key: 'firstTimePassRate', label: 'First-Time Pass Rate', higherIsBetter: true },
  { key: 'averageScore', label: 'Average Score', higherIsBetter: true },
  { key: 'retrainingCount', label: 'Retraining Count', higherIsBetter: false },
  { key: 'expiringCount', label: 'Expiring Certifications', higherIsBetter: false },
];

// ============================================================
// Thresholds
// ============================================================

/** Number of standard deviations for WARNING severity */
const WARNING_THRESHOLD = 1.5;

/** Number of standard deviations for CRITICAL severity */
const CRITICAL_THRESHOLD = 2.0;

/** Minimum number of snapshots required for meaningful statistical analysis */
const MIN_SNAPSHOTS = 3;

// ============================================================
// Statistical Helpers
// ============================================================

/**
 * Calculate the arithmetic mean of an array of numbers.
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate the population standard deviation of an array of numbers.
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

// ============================================================
// Main Detection Function
// ============================================================

/**
 * Detect anomalies in current KPI values compared to historical snapshots.
 *
 * Uses a 6-month moving average and standard deviation approach.
 * Only snapshots provided are used for the baseline calculation,
 * so the caller should pass the appropriate historical window
 * (typically the last 6 months via getKPISnapshots(6)).
 *
 * @param snapshots - Historical KPI snapshots (sorted newest-first is fine)
 * @param currentKPIs - Current KPI values as a Record<string, number>
 * @returns Array of detected anomalies, sorted by severity (CRITICAL first) then deviation magnitude
 */
export function detectAnomalies(
  snapshots: KPISnapshot[],
  currentKPIs: Record<string, number>
): KPIAnomaly[] {
  // Need sufficient historical data for meaningful analysis
  if (snapshots.length < MIN_SNAPSHOTS) {
    return [];
  }

  const anomalies: KPIAnomaly[] = [];

  for (const fieldConfig of KPI_FIELDS) {
    const { key, label, higherIsBetter } = fieldConfig;

    // Extract historical values for this field
    const historicalValues = snapshots
      .map((s) => (s as unknown as Record<string, number>)[key])
      .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));

    if (historicalValues.length < MIN_SNAPSHOTS) {
      continue;
    }

    const currentValue = currentKPIs[key];
    if (currentValue === undefined || currentValue === null || Number.isNaN(currentValue)) {
      continue;
    }

    const mean = calculateMean(historicalValues);
    const stdDev = calculateStdDev(historicalValues, mean);

    // If stdDev is 0 or near-zero, all historical values are identical.
    // Only flag if the current value is actually different from the mean.
    if (stdDev < 0.001) {
      // With zero variance, any difference is technically infinite deviation.
      // Skip if current equals mean; otherwise flag as critical.
      if (Math.abs(currentValue - mean) < 0.001) {
        continue;
      }

      // Non-zero difference with zero variance => treat as critical
      const direction: AnomalyDirection = currentValue > mean ? 'UP' : 'DOWN';
      const isPositive = higherIsBetter ? direction === 'UP' : direction === 'DOWN';

      anomalies.push({
        field: key,
        fieldLabel: label,
        currentValue,
        mean,
        stdDev: 0,
        deviation: Infinity,
        severity: 'CRITICAL',
        direction,
        isPositive,
      });
      continue;
    }

    // Calculate deviation in number of standard deviations
    const deviation = (currentValue - mean) / stdDev;
    const absDeviation = Math.abs(deviation);

    // Check thresholds
    if (absDeviation < WARNING_THRESHOLD) {
      continue;
    }

    const severity: AnomalySeverity = absDeviation >= CRITICAL_THRESHOLD ? 'CRITICAL' : 'WARNING';
    const direction: AnomalyDirection = deviation > 0 ? 'UP' : 'DOWN';

    // Determine if the deviation is positive (good) or negative (bad)
    // For "higher is better" fields: UP is positive, DOWN is negative
    // For "lower is better" fields: DOWN is positive, UP is negative
    const isPositive = higherIsBetter ? direction === 'UP' : direction === 'DOWN';

    anomalies.push({
      field: key,
      fieldLabel: label,
      currentValue,
      mean: Math.round(mean * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      deviation: Math.round(absDeviation * 100) / 100,
      severity,
      direction,
      isPositive,
    });
  }

  // Sort: CRITICAL first, then by deviation magnitude descending
  anomalies.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'CRITICAL' ? -1 : 1;
    }
    return b.deviation - a.deviation;
  });

  return anomalies;
}
