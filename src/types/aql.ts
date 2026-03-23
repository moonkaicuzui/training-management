/**
 * AQL Training Recommendation Types
 *
 * Types for AQL (Acceptable Quality Level) fail-based training enrollment system.
 *
 * 핵심 개념:
 *   EMPLOYEE NO = TQC/RQC 검사원 (제화라인에서 제품을 정품 등록한 사람, 교육 대상)
 *   OFFICIAL INSPECTOR = CFA 검사관 (AQL 검사를 수행한 사람, 참고용)
 *
 * AQL Reject PO의 EMPLOYEE NO(TQC/RQC) → 교육 대상 + 상사 연쇄 등록.
 */

// ========== Raw API Data ==========

/** Raw row from AQL Report GAS API */
export interface AqlRawRow {
  'EMPLOYEE NO': string;           // TQC/RQC 검사원 사번 (제품을 정품 등록한 사람, 교육 대상)
  'OFFICIAL INSPECTOR': string;    // CFA 검사관 (AQL 검사 수행자, 참고용)
  'RESULT': string;          // 'PASS' | 'FAIL'
  'PO NO 1.': string;
  'BUILDING': string;
  'LINE': string;
  'DESCRIPTION': string;     // Defect details (comma-separated)
  'DATE': string;
  'MODEL': string;
  'MONTH': string;
  [key: string]: string | undefined;
}

// ========== API Responses ==========

export interface AqlMonthOption {
  year: number;
  month: number;
  year_month: string;
  label: string;
}

export interface AqlMonthsResponse {
  success: boolean;
  months: AqlMonthOption[];
}

export interface AqlDataResponse {
  success: boolean;
  data: AqlRawRow[];
  year: number;
  month: number;
}

// ========== Processed Data ==========

/**
 * Per-employee aggregated record.
 * "Inspector" in the type name is a legacy term — the actual subject is:
 *   TQC/RQC 검사원 (EMPLOYEE NO = 제화라인에서 제품을 정품 등록한 사람, 교육 대상)
 */
export interface AqlInspectorRecord {
  employee_no: string;            // TQC/RQC 검사원 사번 (교육 대상)
  employee_name: string;          // Resolved from HR employees (by EMPLOYEE NO)
  tqc_num: string;                // TQC NUM from AQL data
  official_inspector: string;     // CFA 검사관 (AQL 검사 수행자, 참고용)
  buildings: string[];
  total_inspections: number;
  pass_count: number;
  fail_count: number;
  fail_rate: number;
  parsed_defects: Record<string, number>;  // defect_type → count
  po_numbers: string[];                     // FAIL PO list
}

/** Processed AQL data summary */
export interface AqlProcessedData {
  stats: {
    total: number;
    pass: number;
    fail: number;
    fail_rate: number;
    inspectors: number;
    failing_inspectors: number;
  };
  inspectorRecords: AqlInspectorRecord[];
  buildingRecords: Array<{
    building: string;
    total: number;
    fail_count: number;
    fail_rate: number;
  }>;
  defectTypes: Array<{
    type: string;
    count: number;
  }>;
}

// ========== Firestore Documents ==========

/** Supervisor link (imported from Basic Manpower CSV) */
export interface AqlSupervisorLink {
  link_id: string;
  employee_no: string;
  employee_name: string;
  supervisor_no: string;
  supervisor_name: string;
  building: string;
  imported_at: string;
  source_file: string;
}

/**
 * AQL EMPLOYEE NO ↔ Q-TRAIN Employee link.
 *
 * @deprecated EMPLOYEE NO는 TQC/RQC 검사원 사번으로 Q-TRAIN employee_id와 직접 매칭 가능.
 * 별도 매핑 테이블 없이 employees 컬렉션에서 직접 조회할 수 있음.
 * 기존 데이터 호환을 위해 유지하되, 신규 구현에서는 직접 매칭을 우선 사용할 것.
 */
export interface AqlEmployeeLink {
  link_id: string;
  aql_employee_no: string;
  aql_employee_name: string;
  employee_id: string;
  employee_name: string;
  created_at: string;
}

/**
 * Enrollment reason.
 * 'INSPECTOR_FAIL' = TQC/RQC 검사원 불합격 (EMPLOYEE NO 기준, 교육 대상)
 * 'SUPERVISOR_ESCALATION' = 상사 연쇄 등록 (검사원의 직속 상사)
 */
export type AqlEnrollmentReason = 'INSPECTOR_FAIL' | 'SUPERVISOR_ESCALATION';

/** Enrollment audit log (APPEND-ONLY) */
export interface AqlEnrollmentLog {
  log_id: string;
  aql_employee_no: string;
  aql_employee_name: string;
  employee_id: string;
  employee_name: string;
  program_code: string;
  program_name: string;
  reason: AqlEnrollmentReason;
  defect_types: string[];
  fail_rate: number;
  fail_po_numbers: string[];
  supervisor_no?: string;
  supervisor_name?: string;
  enrolled_by: string;
  enrolled_at: string;
  year_month: string;
}

// ========== Analysis Results (computed, not stored) ==========

/** AQL priority levels */
export type AqlPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM';

/** Recommended program (reuses structure from 5PRS) */
export interface AqlRecommendedProgram {
  program_code: string;
  program_name: string;
  match_reason: string;
}

/** Single AQL training recommendation */
export interface AqlTrainingRecommendation {
  aql_employee_no: string;
  aql_employee_name: string;
  buildings: string[];
  total_inspections: number;
  fail_count: number;
  fail_rate: number;
  priority: AqlPriority;
  priority_score: number;
  top_defects: Array<{ type: string; count: number }>;
  recommended_programs: AqlRecommendedProgram[];
  linked_employee?: {
    employee_id: string;
    employee_name: string;
  };
  supervisor?: {
    employee_no: string;
    employee_name: string;
    linked_employee_id?: string;
  };
  enrollment_status: 'PENDING' | 'ENROLLED' | 'SKIPPED';
  enrollment_reason: AqlEnrollmentReason;
}

// ========== UI State ==========

export interface AqlFilters {
  priority?: AqlPriority;
  building?: string;
  linkStatus?: 'linked' | 'unlinked' | 'all';
  enrollmentStatus?: 'PENDING' | 'ENROLLED' | 'SKIPPED' | 'all';
  reason?: AqlEnrollmentReason | 'all';
  search?: string;
}
