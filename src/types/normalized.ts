// ============================================================
// Normalized Type Definitions
// Q-TRAIN Data Model - Improved Version
// ============================================================

import type {
  Department,
  Position,
  Building,
  EmployeeStatus,
  ProgramCategory,
  EvaluationType,
  Grade,
  TrainingResult,
  SessionStatus,
  ChangeAction,
} from './index';

import type {
  EmployeeId,
  ProgramCode,
  SessionId,
  ResultId,
  LogId,
} from './branded';

import type {
  ISODate,
  ISODateTime,
  TimeString,
} from './datetime';

// ============================================================
// Employee Types (Normalized)
// ============================================================

export interface NormalizedEmployee {
  employee_id: EmployeeId;
  employee_name: string;
  department: Department;
  position: Position;
  building: Building;
  line: string;
  hire_date: ISODate;
  status: EmployeeStatus;
  updated_at: ISODateTime;
}

export interface NormalizedEmployeeFilters {
  department?: Department;
  position?: Position;
  building?: Building;
  line?: string;
  status?: EmployeeStatus;
  search?: string;
}

// ============================================================
// Training Program Types (Normalized)
// ============================================================

/**
 * Grade thresholds for training programs
 * Used for programs with SCORE evaluation type
 */
export interface GradeThresholds {
  aa: number;  // 90-100
  a: number;   // 80-89
  b: number;   // 70-79
  // Below b threshold is Grade C
}

/**
 * Training program with normalized grade thresholds
 */
export interface NormalizedTrainingProgram {
  program_code: ProgramCode;
  program_name: string;
  program_name_vn: string;
  program_name_kr: string;
  category: ProgramCategory;
  tags: readonly string[];  // Immutable array
  target_positions: readonly Position[];  // Immutable array
  evaluation_type: EvaluationType;
  passing_score: number;
  grade_thresholds: GradeThresholds;  // ✅ Normalized
  duration_hours: number;
  validity_months: number | null;  // null = no expiration
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface NormalizedProgramFilters {
  category?: ProgramCategory;
  showInactive?: boolean;
  search?: string;
  tags?: readonly string[];
}

// ============================================================
// Training Session Types (Normalized)
// ============================================================

/**
 * Trainer information
 */
export interface Trainer {
  name: string;
  employee_id?: EmployeeId;  // Optional if external trainer
}

/**
 * Training session with normalized trainer field
 */
export interface NormalizedTrainingSession {
  session_id: SessionId;
  program_code: ProgramCode;
  session_date: ISODate;
  session_time: TimeString;
  trainer: Trainer;  // ✅ Normalized
  location: string;
  max_attendees: number;
  attendees: readonly EmployeeId[];  // ✅ Typed array
  status: SessionStatus;
  notes: string;
  created_by: string;  // User who created the session
  created_at: ISODateTime;
}

export interface NormalizedSessionFilters {
  startDate?: ISODate;
  endDate?: ISODate;
  programCode?: ProgramCode;
  status?: SessionStatus;
}

// ============================================================
// Training Result Types (Normalized)
// ============================================================

/**
 * Training result record with clear nullable semantics
 */
export interface NormalizedTrainingResultRecord {
  result_id: ResultId;
  session_id: SessionId | null;  // null if manual entry (no session)
  employee_id: EmployeeId;
  program_code: ProgramCode;
  training_date: ISODate;

  // Evaluation results
  score: number | null;  // null if PASS_FAIL evaluation or ABSENT
  grade: Grade | null;   // null if PASS_FAIL evaluation or ABSENT
  result: TrainingResult;
  needs_retraining: boolean;

  // Metadata
  evaluated_by: string;  // User who evaluated
  remarks: string;
  created_at: ISODateTime;
  updated_at: ISODateTime | null;  // null if never updated
  updated_by: string | null;       // null if never updated
}

export interface NormalizedResultFilters {
  employeeId?: EmployeeId;
  programCode?: ProgramCode;
  startDate?: ISODate;
  endDate?: ISODate;
  result?: TrainingResult;
  grade?: Grade;
  needsRetraining?: boolean;  // ✅ Added filter
}

export interface NormalizedResultInput {
  employee_id: EmployeeId;
  program_code: ProgramCode;
  training_date: ISODate;
  score: number | null;
  result: TrainingResult;
  evaluated_by: string;
  remarks?: string;
  session_id?: SessionId;
}

export interface NormalizedResultUpdate {
  result_id: ResultId;
  score?: number | null;
  result?: TrainingResult;
  remarks?: string;
  edit_reason: string;  // Required for audit trail
}

// ============================================================
// Log Types (Normalized)
// ============================================================

export interface NormalizedProgramChangeLog {
  log_id: LogId;
  program_code: ProgramCode;
  action: ChangeAction;
  changed_by: string;
  before_data: string | null;  // JSON stringified
  after_data: string | null;   // JSON stringified
  changed_at: ISODateTime;
}

export interface NormalizedResultEditLog {
  log_id: LogId;
  result_id: ResultId;
  before_data: string;  // JSON stringified (never null - must have before state)
  after_data: string;   // JSON stringified
  edit_reason: string;
  edited_by: string;
  edited_at: ISODateTime;
}

// ============================================================
// Progress Matrix Types (Normalized)
// ============================================================

/**
 * Status of a training for an employee
 */
export type TrainingStatus =
  | 'NOT_TAKEN'    // Never completed
  | 'PASS'         // Passed and valid
  | 'FAIL'         // Failed, needs retraining
  | 'EXPIRING'     // Valid but expiring soon
  | 'EXPIRED';     // Expired, needs retraining

/**
 * Single cell in progress matrix
 */
export interface NormalizedProgressCell {
  employee_id: EmployeeId;
  program_code: ProgramCode;
  status: TrainingStatus;

  // Last training result (null if never taken)
  last_result: TrainingResult | null;
  last_score: number | null;
  last_grade: Grade | null;
  last_training_date: ISODate | null;

  // Expiration info (null if no expiration or never taken)
  expiration_date: ISODate | null;
  days_until_expiry: number | null;

  // Statistics
  completion_count: number;  // Total times completed
}

/**
 * Full progress matrix data
 */
export interface NormalizedProgressMatrixData {
  employees: readonly NormalizedEmployee[];
  programs: readonly NormalizedTrainingProgram[];
  cells: readonly NormalizedProgressCell[];

  // Pre-computed matrix for efficient lookup
  // matrix[employeeId][programCode] = cell
  matrix: Readonly<Record<EmployeeId, Readonly<Record<ProgramCode, NormalizedProgressCell>>>>;
}

export interface NormalizedProgressMatrixFilters {
  building?: Building;
  department?: Department;
  line?: string;
  position?: Position;
  category?: ProgramCategory;
  status?: TrainingStatus;  // ✅ Added filter
}

// ============================================================
// Retraining & Expiring Types (Normalized)
// ============================================================

export type RetrainingReason =
  | 'FAILED'         // Failed the training
  | 'EXPIRED'        // Training expired
  | 'EXPIRING_SOON'; // Expiring within threshold

export interface NormalizedRetrainingTarget {
  employee: NormalizedEmployee;
  program: NormalizedTrainingProgram;
  last_result: NormalizedTrainingResultRecord;
  reason: RetrainingReason;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';  // ✅ Added priority
  recommended_programs?: readonly NormalizedTrainingProgram[];
}

export interface NormalizedExpiringTraining {
  employee: NormalizedEmployee;
  program: NormalizedTrainingProgram;
  last_pass_date: ISODate;
  expiration_date: ISODate;
  days_until_expiry: number;
  priority: 'URGENT' | 'SOON' | 'NORMAL';  // ✅ Added priority
}

// ============================================================
// Type Conversion Utilities
// ============================================================

/**
 * Convert legacy TrainingProgram to normalized version
 */
export const normalizeTrainingProgram = (
  program: any
): NormalizedTrainingProgram => {
  return {
    ...program,
    program_code: program.program_code as ProgramCode,
    tags: Object.freeze([...program.tags]),
    target_positions: Object.freeze([...program.target_positions]),
    grade_thresholds: {
      aa: program.grade_aa,
      a: program.grade_a,
      b: program.grade_b,
    },
    created_at: program.created_at as ISODateTime,
    updated_at: program.updated_at as ISODateTime,
  };
};

/**
 * Convert normalized TrainingProgram to legacy format
 */
export const denormalizeTrainingProgram = (
  program: NormalizedTrainingProgram
): any => {
  return {
    ...program,
    tags: [...program.tags],
    target_positions: [...program.target_positions],
    grade_aa: program.grade_thresholds.aa,
    grade_a: program.grade_thresholds.a,
    grade_b: program.grade_thresholds.b,
  };
};

// ============================================================
// Additional Type Conversion Utilities
// ============================================================

import type {
  Employee,
  TrainingSession,
  TrainingResultRecord,
} from './index';

import {
  unsafeEmployeeId,
  unsafeProgramCode,
  unsafeSessionId,
  unsafeResultId,
} from './branded';

import {
  unsafeISODate,
  unsafeISODateTime,
  unsafeTimeString,
} from './datetime';

/**
 * Convert legacy Employee to normalized version
 */
export const normalizeEmployee = (
  employee: Employee
): NormalizedEmployee => {
  return {
    employee_id: unsafeEmployeeId(employee.employee_id),
    employee_name: employee.employee_name,
    department: employee.department,
    position: employee.position,
    building: employee.building,
    line: employee.line,
    hire_date: unsafeISODate(employee.hire_date),
    status: employee.status,
    updated_at: unsafeISODateTime(employee.updated_at),
  };
};

/**
 * Convert legacy TrainingSession to normalized version
 */
export const normalizeTrainingSession = (
  session: TrainingSession
): NormalizedTrainingSession => {
  return {
    session_id: unsafeSessionId(session.session_id),
    program_code: unsafeProgramCode(session.program_code),
    session_date: unsafeISODate(session.session_date),
    session_time: unsafeTimeString(session.session_time),
    trainer: {
      name: session.trainer_name || session.trainer,
      employee_id: undefined, // Legacy doesn't have this
    },
    location: session.location,
    max_attendees: session.max_attendees,
    attendees: Object.freeze(session.attendees.map(unsafeEmployeeId)),
    status: session.status,
    notes: session.notes,
    created_by: session.created_by,
    created_at: unsafeISODateTime(session.created_at),
  };
};

/**
 * Convert legacy TrainingResultRecord to normalized version
 */
export const normalizeTrainingResult = (
  result: TrainingResultRecord
): NormalizedTrainingResultRecord => {
  return {
    result_id: unsafeResultId(result.result_id),
    session_id: result.session_id ? unsafeSessionId(result.session_id) : null,
    employee_id: unsafeEmployeeId(result.employee_id),
    program_code: unsafeProgramCode(result.program_code),
    training_date: unsafeISODate(result.training_date),
    score: result.score,
    grade: result.grade,
    result: result.result,
    needs_retraining: result.needs_retraining,
    evaluated_by: result.evaluated_by,
    remarks: result.remarks,
    created_at: unsafeISODateTime(result.created_at),
    updated_at: result.updated_at ? unsafeISODateTime(result.updated_at) : null,
    updated_by: result.updated_by,
  };
};

/**
 * Batch normalize employees
 */
export const normalizeEmployees = (
  employees: Employee[]
): NormalizedEmployee[] => {
  return employees.map(normalizeEmployee);
};

/**
 * Batch normalize programs
 */
export const normalizeTrainingPrograms = (
  programs: any[]
): NormalizedTrainingProgram[] => {
  return programs.map(normalizeTrainingProgram);
};

/**
 * Batch normalize sessions
 */
export const normalizeTrainingSessions = (
  sessions: TrainingSession[]
): NormalizedTrainingSession[] => {
  return sessions.map(normalizeTrainingSession);
};

/**
 * Batch normalize results
 */
export const normalizeTrainingResults = (
  results: TrainingResultRecord[]
): NormalizedTrainingResultRecord[] => {
  return results.map(normalizeTrainingResult);
};
