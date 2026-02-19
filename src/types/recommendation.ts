/**
 * 5PRS Training Recommendation Types
 *
 * Types for AI-based training recommendation system that analyzes
 * 5PRS inspection data to identify TQC inspectors needing training.
 */

// ========== Enums ==========

export type RecommendationPriority = 'IMMEDIATE' | 'PREVENTIVE' | 'SURGE';

export type EnrollmentStatus = 'PENDING' | 'ENROLLED' | 'SKIPPED';

// ========== Firestore Documents ==========

/** Defect type → Training program mapping (stored in Firestore) */
export interface DefectTrainingMapping {
  mapping_id: string;
  defect_type: string;
  program_codes: string[];
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Threshold configuration (singleton document in Firestore) */
export interface RecommendationThreshold {
  threshold_id: string;
  immediate_rate: number;       // e.g., 5 (%)
  preventive_rate_min: number;  // e.g., 3 (%)
  preventive_rate_max: number;  // e.g., 5 (%)
  min_validation_count: number; // e.g., 100
  surge_multiplier: number;     // e.g., 2 (2x increase)
  surge_min_rate: number;       // e.g., 3 (%)
  surge_recent_days: number;    // e.g., 3
  surge_past_days: number;      // e.g., 28
  updated_at: string;
  updated_by: string;
}

/** TQC ID ↔ Q-TRAIN Employee ID link */
export interface TqcEmployeeLink {
  link_id: string;
  tqc_id: string;
  tqc_name: string;
  employee_id: string;
  employee_name: string;
  created_at: string;
}

/** Enrollment audit log entry (APPEND-ONLY) */
export interface FivePrsEnrollmentLog {
  log_id: string;
  tqc_id: string;
  tqc_name: string;
  employee_id: string;
  employee_name: string;
  program_code: string;
  program_name: string;
  session_id?: string;
  priority: RecommendationPriority;
  priority_score: number;
  defect_types: string[];
  reject_rate: number;
  enrolled_by: string;
  enrolled_at: string;
  year_month: string;
}

// ========== Analysis Results (computed, not stored) ==========

/** Surge detection result */
export interface SurgeDetection {
  building: string;
  defect: string;
  recentRate: number;
  pastRate: number;
  increasePercent: number;
  problemTqcIds: string[];
}

/** Recommended training program */
export interface RecommendedProgram {
  program_code: string;
  program_name: string;
  match_reason: string;   // which defect type matched
}

/** Single TQC training recommendation */
export interface TrainingRecommendation {
  tqc_id: string;
  tqc_name: string;
  buildings: string[];
  totalValidation: number;
  totalReject: number;
  rejectRate: number;
  priority: RecommendationPriority;
  priorityScore: number;              // 0-100
  topDefects: Array<{ type: string; count: number }>;
  recommendedPrograms: RecommendedProgram[];
  linkedEmployee?: {
    employee_id: string;
    employee_name: string;
  };
  surgeInfo?: SurgeDetection;
  enrollmentStatus: EnrollmentStatus;
}

// ========== UI State ==========

export interface RecommendationFilters {
  priority?: RecommendationPriority;
  building?: string;
  linkStatus?: 'linked' | 'unlinked' | 'all';
  enrollmentStatus?: EnrollmentStatus | 'all';
  search?: string;
}

// ========== Default Thresholds ==========

export const DEFAULT_THRESHOLDS: Omit<RecommendationThreshold, 'threshold_id' | 'updated_at' | 'updated_by'> = {
  immediate_rate: 5,
  preventive_rate_min: 3,
  preventive_rate_max: 5,
  min_validation_count: 100,
  surge_multiplier: 2,
  surge_min_rate: 3,
  surge_recent_days: 3,
  surge_past_days: 28,
};
