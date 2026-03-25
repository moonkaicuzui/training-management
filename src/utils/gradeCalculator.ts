// ============================================================
// Q-TRAIN Unified Grade Calculation Utility
// Single source of truth for all grade calculations
// ============================================================

import type { Grade } from '@/types';

// ========== Types ==========

export interface GradeThresholds {
  /** Score threshold for AA grade (default: 100) */
  aa: number;
  /** Score threshold for A grade (default: 90) */
  a: number;
  /** Score threshold for B grade (default: 80) */
  b: number;
}

export interface GradeResult {
  grade: Grade;
  result: 'PASS' | 'FAIL';
}

// ========== Default Thresholds ==========

/** Default grade thresholds: AA=100, A=90, B=80, C=<80 */
export const DEFAULT_GRADE_THRESHOLDS: GradeThresholds = {
  aa: 100,
  a: 90,
  b: 80,
};

/** Inspection grade thresholds: AA=100%, A>=95%, B>=80%, C<80% */
export const INSPECTION_GRADE_THRESHOLDS: GradeThresholds = {
  aa: 100,
  a: 95,
  b: 80,
};

// ========== Grade Calculation Functions ==========

/**
 * Calculate grade based on score and thresholds.
 * Supports program-specific custom thresholds.
 *
 * @param score - Numeric score (0-100)
 * @param thresholds - Custom thresholds (defaults to AA=100, A=90, B=80)
 * @returns Grade ('AA' | 'A' | 'B' | 'C')
 */
export function calculateGrade(
  score: number,
  thresholds?: GradeThresholds
): Grade {
  const t = thresholds ?? DEFAULT_GRADE_THRESHOLDS;
  if (score >= t.aa) return 'AA';
  if (score >= t.a) return 'A';
  if (score >= t.b) return 'B';
  return 'C';
}

/**
 * Calculate grade with pass/fail result.
 * C grade = FAIL, all others = PASS.
 *
 * @param score - Numeric score (0-100)
 * @param thresholds - Custom thresholds (defaults to AA=100, A=90, B=80)
 * @returns { grade, result } object
 */
export function calculateGradeWithResult(
  score: number,
  thresholds?: GradeThresholds
): GradeResult {
  const grade = calculateGrade(score, thresholds);
  return {
    grade,
    result: grade === 'C' ? 'FAIL' : 'PASS',
  };
}

/**
 * Calculate pass/fail result based on score and passing score.
 *
 * @param score - Numeric score or null
 * @param passingScore - Minimum passing score
 * @returns 'PASS' | 'FAIL'
 */
export function calculateResult(
  score: number | null,
  passingScore: number
): 'PASS' | 'FAIL' {
  if (score === null) return 'FAIL';
  return score >= passingScore ? 'PASS' : 'FAIL';
}

/**
 * Calculate inspection grade based on match rate.
 * Uses inspection-specific thresholds: AA=100%, A>=95%, B>=80%, C<80%
 *
 * @param matchRate - Match rate percentage (0-100)
 * @returns Grade ('AA' | 'A' | 'B' | 'C')
 */
export function calculateInspectionGrade(matchRate: number): Grade {
  return calculateGrade(matchRate, INSPECTION_GRADE_THRESHOLDS);
}

/**
 * Build GradeThresholds from program fields.
 * Convenience helper for converting program.grade_aa/grade_a/grade_b to GradeThresholds.
 *
 * @param gradeAA - AA threshold from program
 * @param gradeA - A threshold from program
 * @param gradeB - B threshold from program
 * @returns GradeThresholds object
 */
export function programThresholds(
  gradeAA: number,
  gradeA: number,
  gradeB: number
): GradeThresholds {
  return { aa: gradeAA, a: gradeA, b: gradeB };
}
