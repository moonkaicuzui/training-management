// ============================================================
// Q-TRAIN Type Definitions
// Training Management System for HWK Vietnam
// ============================================================

// ========== Enums ==========

export type Department =
  | 'ASSEMBLY'
  | 'STITCHING'
  | 'CUTTING'
  | 'OSC'
  | 'MTL'
  | 'BOTTOM'
  | 'AQL'
  | 'REPACKING'
  | 'QA'
  | 'OFFICE'
  | 'NEW';

export type Position =
  | 'QIP_TQC'
  | 'QIP_RQC'
  | 'QIP_CFA'
  | 'QIP_QA'
  | 'QIP_LINE_LEADER'
  | 'QIP_GROUP_LEADER'
  | 'QIP_SUPERVISOR'
  | 'QIP_MANAGER_PLUS'
  | 'QIP_OFFICE'
  | 'QIP_NEW_MEMBER'
  | 'PRO_WORKER'
  | 'PRO_LINE_LEADER'
  | 'PRO_GROUP_PLUS';

export type Building =
  | 'BUILDING_A'
  | 'BUILDING_A1'
  | 'BUILDING_A2'
  | 'BUILDING_B'
  | 'BUILDING_B1'
  | 'BUILDING_B2'
  | 'BUILDING_B3'
  | 'BUILDING_C'
  | 'BUILDING_D'
  | 'BUILDING_E1'
  | 'BUILDING_E2'
  | 'BUILDING_EZ_HAPPO'
  | 'BUILDING_FG_WH'
  | 'BUILDING_INHOUSE_EZ'
  | 'BUILDING_INHOUSE_PRINTING'
  | 'BUILDING_MTL_WH'
  | 'BUILDING_OSC_A'
  | 'BUILDING_QA_OFFICE'
  | 'BUILDING_QIP_OFFICE';

// ========== Training Level & Type (2026 Curriculum) ==========

export type TrainingLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';

export type TrainingType = 'REGULAR' | 'SPECIAL';

export type WorkingArea =
  | 'ASSEMBLY'
  | 'STITCHING'
  | 'CUTTING'
  | 'BOTTOM'
  | 'STOCKFIT'
  | 'OSC'
  | 'MTL_HAPPO'
  | 'MTL_HAPPO_EZ'
  | 'MTL_LEATHER'
  | 'MTL_SUBSHI'
  | 'MTL_TEXTILE'
  | 'QA'
  | 'OFFICE'
  | 'REPACKING'
  | 'AQL'
  | 'OCPT';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export type ProgramCategory =
  | 'QIP'
  | 'PRODUCTION'
  | 'RETRAINING'
  | 'NEWCOMER'
  | 'PROMOTION'
  | 'INSPECTION';

export type EvaluationType = 'SCORE' | 'PASS_FAIL' | 'INSPECTION_MATCH';

export type Grade = 'AA' | 'A' | 'B' | 'C';

export type TrainingResult = 'PASS' | 'FAIL' | 'ABSENT';

export type SessionStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED';

export type ChangeAction = 'CREATE' | 'UPDATE' | 'DELETE';

// ========== Employee Types ==========

export interface Employee {
  employee_id: string;
  employee_name: string;
  department: Department;
  position: Position;
  building: Building;
  line: string;
  hire_date: string;
  status: EmployeeStatus;
  updated_at: string;
}

export interface EmployeeFilters {
  department?: Department;
  position?: Position;
  building?: Building;
  line?: string;
  status?: EmployeeStatus;
  search?: string;
}

// ========== Training Program Types ==========

export interface GradeThresholds {
  aa: number;
  a: number;
  b: number;
}

export interface TrainingProgram {
  program_code: string;
  program_name: string;
  program_name_vn: string;
  program_name_kr: string;
  category: ProgramCategory;
  tags: string[];
  target_positions: Position[];
  evaluation_type: EvaluationType;
  passing_score: number;
  grade_aa: number;
  grade_a: number;
  grade_b: number;
  duration_hours: number;
  validity_months: number | null;
  training_level?: TrainingLevel;
  training_type?: TrainingType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgramFilters {
  category?: ProgramCategory;
  showInactive?: boolean;
  search?: string;
  tags?: string[];
}

// ========== Training Session Types ==========

export interface TrainingSession {
  session_id: string;
  program_code: string;
  session_date: string;
  session_time: string;
  trainer_name: string;
  trainer: string;
  location: string;
  max_attendees: number;
  status: SessionStatus;
  training_level?: TrainingLevel;
  training_type?: TrainingType;
  notes: string;
  created_by: string;
  created_at: string;
  attendees: string[]; // employee_ids
}

export interface SessionFilters {
  startDate?: string;
  endDate?: string;
  programCode?: string;
  status?: SessionStatus;
}

// ========== Training Result Types ==========

export interface TrainingResultRecord {
  result_id: string;
  session_id: string | null;
  employee_id: string;
  program_code: string;
  training_date: string;
  score: number | null;
  grade: Grade | null;
  result: TrainingResult;
  needs_retraining: boolean;
  evaluated_by: string;
  remarks: string;
  test_attempt?: number; // 1st/2nd/3rd attempt tracking
  trainer_name?: string;
  stop_working_date?: string;
  created_at: string;
  updated_at: string | null;
  updated_by: string | null;
}

export interface ResultFilters {
  employeeId?: string;
  programCode?: string;
  startDate?: string;
  endDate?: string;
  result?: TrainingResult;
  grade?: Grade;
}

export interface ResultInput {
  employee_id: string;
  program_code: string;
  training_date: string;
  score: number | null;
  result: TrainingResult;
  evaluated_by: string;
  remarks?: string;
  session_id?: string;
}

export interface ResultUpdate {
  result_id: string;
  score?: number | null;
  result?: TrainingResult;
  remarks?: string;
  edit_reason: string;
}

// ========== Log Types ==========

export interface ProgramChangeLog {
  log_id: string;
  program_code: string;
  action: ChangeAction;
  changed_by: string;
  before_data: string | null;
  after_data: string | null;
  changed_at: string;
}

export interface ResultEditLog {
  log_id: string;
  result_id: string;
  before_data: string;
  after_data: string;
  edit_reason: string;
  edited_by: string;
  edited_at: string;
}

// ========== Dashboard Types ==========

export interface DashboardStats {
  totalEmployees: number;
  monthlyCompletions: number;
  overallCompletionRate: number;
  retrainingCount: number;
}

export interface MonthlyTrainingData {
  month: string;
  planned: number;
  completed: number;
}

export interface GradeDistribution {
  grade: Grade;
  count: number;
  percentage: number;
  [key: string]: string | number;
}

// ========== Progress Matrix Types ==========

export interface ProgressCell {
  employeeId: string;
  programCode: string;
  status: 'PASS' | 'FAIL' | 'EXPIRING' | 'EXPIRED' | 'NOT_TAKEN';
  lastResult?: TrainingResultRecord;
  expirationDate?: string;
}

export interface ProgressMatrixCell {
  lastResult: TrainingResult | null;
  lastScore?: number;
  lastGrade?: Grade;
  lastTrainingDate?: string;
  expirationDate?: string;
  isExpiring: boolean;
  isExpired: boolean;
  completionCount: number;
}

export interface ProgressMatrixData {
  employees: Employee[];
  programs: TrainingProgram[];
  cells: ProgressCell[];
  matrix?: Record<string, Record<string, ProgressMatrixCell>>;
}

export interface ProgressMatrixFilters {
  building?: Building;
  department?: string;
  line?: string;
  position?: Position;
  category?: ProgramCategory;
}

// Alias for ResultInput
export type TrainingResultInput = ResultInput;

// ========== Retraining Target Types ==========

export interface RetrainingTarget {
  employee: Employee;
  program: TrainingProgram;
  lastResult: TrainingResultRecord;
  reason: 'FAILED' | 'EXPIRED' | 'EXPIRING_SOON';
  recommendedPrograms?: TrainingProgram[];
}

// ========== Expiring Training Types ==========

export interface ExpiringTraining {
  employee: Employee;
  program: TrainingProgram;
  lastPassDate: string;
  expirationDate: string;
  daysUntilExpiry: number;
}

// ========== API Response Types ==========

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ========== Form Types ==========

export interface EmployeeFormData {
  employee_id: string;
  employee_name: string;
  department: Department;
  position: Position;
  building: Building;
  line: string;
  hire_date: string;
  status: EmployeeStatus;
}

export interface ProgramFormData {
  program_code: string;
  program_name: string;
  program_name_vn: string;
  program_name_kr: string;
  category: ProgramCategory;
  tags: string;
  target_positions: Position[];
  evaluation_type: EvaluationType;
  passing_score: number;
  grade_aa: number;
  grade_a: number;
  grade_b: number;
  duration_hours: number;
  validity_months: number | null;
  training_level?: TrainingLevel;
  training_type?: TrainingType;
}

export interface SessionFormData {
  program_code: string;
  session_date: string;
  session_time: string;
  trainer_name: string;
  location: string;
  training_type?: TrainingType;
  notes?: string;
  attendees: string[];
}

// ========== UI Types ==========

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  description?: string;
  duration?: number;
}

// ========== Language Types ==========

export type Language = 'vi' | 'ko' | 'en';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

// ========== Extended Feature Types ==========

// Re-export new feature types
export * from './attendance';
export * from './trainer';
export * from './notification';
export * from './trainingPlan';
export * from './certificate';
export {
  type Evaluation,
  type EvaluationResponse,
  type EvaluationTemplate,
  type EvaluationQuestion,
  type EffectivenessReport,
  type EvaluationType as TrainingEvaluationType,
  DEFAULT_SATISFACTION_QUESTIONS,
} from './evaluation';

// ========== New TQC (신입 TQC 교육) Types ==========
export * from './newTqc';

// ========== Curriculum & Competency Types ==========
export * from './curriculum';

// ========== CAPA (Corrective and Preventive Action) Types ==========
export * from './capa';

// ========== Material (교육 자료) Types ==========
// NOTE: material.ts types imported directly via '@/types/material'
// to avoid TrainingMaterial name collision with trainingPlan.ts

// ========== Audit Log (감사 로그) Types ==========
export * from './auditLog';

// ========== 5PRS Recommendation Types ==========
export * from './recommendation';

// ========== Inspection Training Types ==========
export * from './inspection';
