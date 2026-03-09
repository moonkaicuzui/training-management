// ============================================================
// Inspection Training Types
// AQL/5PRS Inspection Competency Training (INS-001)
// ============================================================

export type PairJudgment = 'PASS' | 'FAIL';

export interface InspectionPairResult {
  pair_number: number;           // 1-20
  trainee_judgment: PairJudgment;
  inspector_judgment: PairJudgment;
  is_match: boolean;
  defect_notes?: string;
}

export interface InspectionResultDetail {
  inspection_id: string;
  result_id: string;             // FK -> training_results
  employee_id: string;
  program_code: string;          // 'INS-001'
  training_date: string;
  inspector_id: string;
  inspector_name: string;
  trainer_name: string;
  carton_count: number;          // 2
  total_pairs: number;           // 20
  pairs: InspectionPairResult[];
  matched_count: number;
  match_rate: number;            // 0-100
  location: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export type InspectionEnrollmentSource =
  | 'FIVE_PRS_RECOMMENDATION'
  | 'AQL_RECOMMENDATION'
  | 'MANUAL';

export type InspectionEnrollmentStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REASSIGNMENT_REQUIRED';

export interface InspectionEnrollment {
  enrollment_id: string;
  employee_id: string;
  employee_name: string;
  program_code: string;
  source: InspectionEnrollmentSource;
  source_log_id?: string;        // 5PRS/AQL enrollment log ID
  enrolled_by: string;
  enrolled_at: string;
  status: InspectionEnrollmentStatus;
  scheduled_date?: string;
  completed_result_id?: string;
}

export interface InspectionStrikeInfo {
  employee_id: string;
  consecutive_failures: number;
  last_attempts: Array<{
    result_id: string;
    training_date: string;
    match_rate: number;
    result: 'PASS' | 'FAIL';
  }>;
  requires_reassignment: boolean; // consecutive_failures >= 3
}

// Input types for creating records
export interface InspectionResultInput {
  employee_id: string;
  program_code: string;
  training_date: string;
  inspector_id: string;
  inspector_name: string;
  trainer_name: string;
  carton_count: number;
  total_pairs: number;
  pairs: InspectionPairResult[];
  location: string;
  notes?: string;
  enrollment_id?: string;        // optional link to enrollment
}

export interface InspectionEnrollmentInput {
  employee_id: string;
  employee_name: string;
  program_code: string;
  source: InspectionEnrollmentSource;
  source_log_id?: string;
  enrolled_by: string;
  scheduled_date?: string;
}

export interface InspectionEnrollmentFilters {
  status?: InspectionEnrollmentStatus;
  source?: InspectionEnrollmentSource;
  employee_id?: string;
}
