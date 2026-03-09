// ============================================================
// Normalized Store - Shared Types
// ============================================================

import type {
  NormalizedEmployee,
  NormalizedTrainingProgram,
  NormalizedTrainingSession,
  NormalizedTrainingResultRecord,
  NormalizedEmployeeFilters,
  NormalizedProgramFilters,
  NormalizedSessionFilters,
  NormalizedResultFilters,
  NormalizedProgressMatrixFilters,
  NormalizedProgressMatrixData,
  NormalizedRetrainingTarget,
  NormalizedExpiringTraining,
} from '@/types/normalized';
import type {
  EmployeeId,
  ProgramCode,
  SessionId,
  ResultId,
} from '@/types/branded';
import type {
  DashboardStats,
  MonthlyTrainingData,
  GradeDistribution,
} from '@/types';

// ============================================================
// State Structure (Normalized)
// ============================================================

/**
 * Normalized entities stored in maps for efficient lookup
 */
export interface NormalizedEntities {
  employees: Map<EmployeeId, NormalizedEmployee>;
  programs: Map<ProgramCode, NormalizedTrainingProgram>;
  sessions: Map<SessionId, NormalizedTrainingSession>;
  results: Map<ResultId, NormalizedTrainingResultRecord>;
}

/**
 * Index structures for efficient querying
 */
export interface EntityIndexes {
  resultsByEmployee: Map<EmployeeId, Set<ResultId>>;
  resultsByProgram: Map<ProgramCode, Set<ResultId>>;
  sessionsByProgram: Map<ProgramCode, Set<SessionId>>;
  resultsBySession: Map<SessionId, Set<ResultId>>;
}

/**
 * UI State (separated from data)
 */
export interface UIState {
  selectedEmployeeId: EmployeeId | null;
  selectedProgramCode: ProgramCode | null;
  selectedSessionId: SessionId | null;
}

/**
 * Filter State (centralized)
 */
export interface FilterState {
  employees: NormalizedEmployeeFilters;
  programs: NormalizedProgramFilters;
  sessions: NormalizedSessionFilters;
  results: NormalizedResultFilters;
  progressMatrix: NormalizedProgressMatrixFilters;
}

/**
 * Loading State (fine-grained)
 */
export interface LoadingState {
  entities: {
    employees: boolean;
    programs: boolean;
    sessions: boolean;
    results: boolean;
  };
  views: {
    dashboard: boolean;
    progressMatrix: boolean;
    retraining: boolean;
  };
}

/**
 * Computed/Derived Data
 */
export interface DerivedData {
  dashboard: {
    stats: DashboardStats | null;
    monthlyData: MonthlyTrainingData[];
    gradeDistribution: GradeDistribution[];
  };
  progressMatrix: NormalizedProgressMatrixData | null;
  retraining: {
    targets: NormalizedRetrainingTarget[];
    expiring: NormalizedExpiringTraining[];
  };
}

// ============================================================
// Full Store State Type
// ============================================================

export interface NormalizedTrainingState {
  // Core normalized data
  entities: NormalizedEntities;
  indexes: EntityIndexes;

  // UI state
  ui: UIState;

  // Filter state
  filters: FilterState;

  // Loading state
  loading: LoadingState;

  // Derived data
  derived: DerivedData;

  // Error state
  error: string | null;

  // ========== Employee Actions ==========
  fetchEmployees: (filters?: NormalizedEmployeeFilters) => Promise<void>;
  getEmployee: (id: EmployeeId) => NormalizedEmployee | undefined;
  setSelectedEmployee: (id: EmployeeId | null) => void;
  addEmployee: (employee: NormalizedEmployee) => void;
  updateEmployee: (id: EmployeeId, updates: Partial<NormalizedEmployee>) => void;
  setEmployeeFilters: (filters: NormalizedEmployeeFilters) => void;

  // ========== Program Actions ==========
  fetchPrograms: (filters?: NormalizedProgramFilters) => Promise<void>;
  getProgram: (code: ProgramCode) => NormalizedTrainingProgram | undefined;
  setSelectedProgram: (code: ProgramCode | null) => void;
  addProgram: (program: NormalizedTrainingProgram) => void;
  updateProgram: (code: ProgramCode, updates: Partial<NormalizedTrainingProgram>) => void;
  deactivateProgram: (code: ProgramCode) => void;
  setProgramFilters: (filters: NormalizedProgramFilters) => void;

  // ========== Session Actions ==========
  fetchSessions: (filters?: NormalizedSessionFilters) => Promise<void>;
  getSession: (id: SessionId) => NormalizedTrainingSession | undefined;
  setSelectedSession: (id: SessionId | null) => void;
  addSession: (session: NormalizedTrainingSession) => void;
  updateSession: (id: SessionId, updates: Partial<NormalizedTrainingSession>) => void;
  cancelSession: (id: SessionId) => void;
  setSessionFilters: (filters: NormalizedSessionFilters) => void;
  getProgramSessions: (programCode: ProgramCode) => NormalizedTrainingSession[];

  // ========== Result Actions ==========
  fetchResults: (filters?: NormalizedResultFilters) => Promise<void>;
  getResult: (id: ResultId) => NormalizedTrainingResultRecord | undefined;
  addResult: (result: NormalizedTrainingResultRecord) => void;
  updateResult: (id: ResultId, updates: Partial<NormalizedTrainingResultRecord>) => void;
  setResultFilters: (filters: NormalizedResultFilters) => void;
  getEmployeeHistory: (employeeId: EmployeeId) => NormalizedTrainingResultRecord[];
  getProgramResults: (programCode: ProgramCode) => NormalizedTrainingResultRecord[];
  getSessionResults: (sessionId: SessionId) => NormalizedTrainingResultRecord[];

  // ========== Progress Matrix Actions ==========
  setProgressFilters: (filters: NormalizedProgressMatrixFilters) => void;
  fetchProgressMatrix: (filters?: NormalizedProgressMatrixFilters) => Promise<void>;

  // ========== Dashboard Actions ==========
  fetchDashboardStats: () => Promise<void>;
  fetchMonthlyData: () => Promise<void>;
  fetchGradeDistribution: () => Promise<void>;

  // ========== Retraining Actions ==========
  fetchRetrainingTargets: () => Promise<void>;
  fetchExpiringTrainings: (days?: number) => Promise<void>;

  // ========== Utility Actions ==========
  rebuildIndexes: () => void;
  clearAllData: () => void;
  clearError: () => void;
  clearAllFilters: () => void;
}
