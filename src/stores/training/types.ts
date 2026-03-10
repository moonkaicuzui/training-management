import type {
  Employee,
  EmployeeFilters,
  TrainingProgram,
  ProgramFilters,
  TrainingSession,
  SessionFilters,
  TrainingResultRecord,
  ResultFilters,
  DashboardStats,
  MonthlyTrainingData,
  GradeDistribution,
  ProgressMatrixData,
  ProgressMatrixFilters,
  RetrainingTarget,
  ExpiringTraining,
} from '@/types';
import type * as api from '@/services/api';

export interface TrainingState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  employeeFilters: EmployeeFilters;
  employeeHistory: TrainingResultRecord[];

  programs: TrainingProgram[];
  selectedProgram: TrainingProgram | null;
  programFilters: ProgramFilters;

  sessions: TrainingSession[];
  selectedSession: TrainingSession | null;
  sessionFilters: SessionFilters;

  results: TrainingResultRecord[];
  resultFilters: ResultFilters;

  dashboardStats: DashboardStats | null;
  monthlyData: MonthlyTrainingData[];
  gradeDistribution: GradeDistribution[];

  progressMatrix: ProgressMatrixData | null;
  progressFilters: ProgressMatrixFilters;

  retrainingTargets: RetrainingTarget[];
  expiringTrainings: ExpiringTraining[];
  expiredTrainings: ExpiringTraining[];

  error: string | null;

  loading: {
    employees: boolean;
    programs: boolean;
    sessions: boolean;
    results: boolean;
    dashboard: boolean;
    progressMatrix: boolean;
    progress: boolean;
    retraining: boolean;
  };

  clearError: () => void;
  clearAllData: () => void;

  fetchEmployees: (filters?: EmployeeFilters) => Promise<void>;
  fetchEmployee: (id: string) => Promise<void>;
  fetchEmployeeHistory: (id: string) => Promise<void>;
  setEmployeeFilters: (filters: EmployeeFilters) => void;
  createEmployee: (employee: Omit<Employee, 'updated_at'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;

  fetchPrograms: (filters?: ProgramFilters) => Promise<void>;
  fetchProgram: (code: string) => Promise<void>;
  setProgramFilters: (filters: ProgramFilters) => void;
  createProgram: (program: Omit<TrainingProgram, 'created_at' | 'updated_at'>) => Promise<TrainingProgram>;
  updateProgram: (code: string, updates: Partial<TrainingProgram>) => Promise<void>;
  deleteProgram: (code: string) => Promise<void>;

  fetchSessions: (filters?: SessionFilters) => Promise<void>;
  setSessionFilters: (filters: SessionFilters) => void;
  createSession: (session: Omit<TrainingSession, 'session_id' | 'created_at'>) => Promise<TrainingSession>;
  updateSession: (id: string, updates: Partial<TrainingSession>) => Promise<void>;
  cancelSession: (id: string) => Promise<void>;

  fetchResults: (filters?: ResultFilters) => Promise<void>;
  setResultFilters: (filters: ResultFilters) => void;
  recordResults: (results: Parameters<typeof api.recordResults>[0]) => Promise<TrainingResultRecord[]>;
  updateResult: (resultId: string, updates: { score?: number | null; result?: 'PASS' | 'FAIL' | 'ABSENT'; remarks?: string }, editReason: string) => Promise<void>;

  fetchDashboardStats: () => Promise<void>;
  fetchMonthlyData: () => Promise<void>;
  fetchGradeDistribution: () => Promise<void>;

  fetchProgressMatrix: (filters?: ProgressMatrixFilters) => Promise<void>;
  setProgressFilters: (filters: ProgressMatrixFilters) => void;

  fetchRetrainingTargets: () => Promise<void>;
  fetchExpiringTrainings: (days?: number) => Promise<void>;
  fetchExpiredTrainings: () => Promise<void>;
}

export type StoreSet = {
  (partial: TrainingState | Partial<TrainingState> | ((state: TrainingState) => TrainingState | Partial<TrainingState>), replace?: false): void;
  (state: TrainingState | ((state: TrainingState) => TrainingState), replace: true): void;
};

export type StoreGet = () => TrainingState;
