import { create } from 'zustand';
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

import * as api from '@/services/api';

interface TrainingState {
  // Employees
  employees: Employee[];
  selectedEmployee: Employee | null;
  employeeFilters: EmployeeFilters;
  employeeHistory: TrainingResultRecord[];

  // Programs
  programs: TrainingProgram[];
  selectedProgram: TrainingProgram | null;
  programFilters: ProgramFilters;

  // Sessions
  sessions: TrainingSession[];
  selectedSession: TrainingSession | null;
  sessionFilters: SessionFilters;

  // Results
  results: TrainingResultRecord[];
  resultFilters: ResultFilters;

  // Dashboard
  dashboardStats: DashboardStats | null;
  monthlyData: MonthlyTrainingData[];
  gradeDistribution: GradeDistribution[];

  // Progress Matrix
  progressMatrix: ProgressMatrixData | null;
  progressFilters: ProgressMatrixFilters;

  // Retraining & Expiring
  retrainingTargets: RetrainingTarget[];
  expiringTrainings: ExpiringTraining[];

  // Loading states
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

  // Actions - Employees
  fetchEmployees: (filters?: EmployeeFilters) => Promise<void>;
  fetchEmployee: (id: string) => Promise<void>;
  fetchEmployeeHistory: (id: string) => Promise<void>;
  setEmployeeFilters: (filters: EmployeeFilters) => void;
  createEmployee: (employee: Omit<Employee, 'updated_at'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;

  // Actions - Programs
  fetchPrograms: (filters?: ProgramFilters) => Promise<void>;
  fetchProgram: (code: string) => Promise<void>;
  setProgramFilters: (filters: ProgramFilters) => void;
  createProgram: (program: Omit<TrainingProgram, 'created_at' | 'updated_at'>) => Promise<TrainingProgram>;
  updateProgram: (code: string, updates: Partial<TrainingProgram>) => Promise<void>;
  deleteProgram: (code: string) => Promise<void>;

  // Actions - Sessions
  fetchSessions: (filters?: SessionFilters) => Promise<void>;
  setSessionFilters: (filters: SessionFilters) => void;
  createSession: (session: Omit<TrainingSession, 'session_id' | 'created_at'>) => Promise<TrainingSession>;
  updateSession: (id: string, updates: Partial<TrainingSession>) => Promise<void>;
  cancelSession: (id: string) => Promise<void>;

  // Actions - Results
  fetchResults: (filters?: ResultFilters) => Promise<void>;
  setResultFilters: (filters: ResultFilters) => void;
  recordResults: (results: Parameters<typeof api.recordResults>[0]) => Promise<TrainingResultRecord[]>;
  updateResult: (resultId: string, updates: { score?: number | null; result?: 'PASS' | 'FAIL' | 'ABSENT'; remarks?: string }, editReason: string) => Promise<void>;

  // Actions - Dashboard
  fetchDashboardStats: () => Promise<void>;
  fetchMonthlyData: () => Promise<void>;
  fetchGradeDistribution: () => Promise<void>;

  // Actions - Progress Matrix
  fetchProgressMatrix: (filters?: ProgressMatrixFilters) => Promise<void>;
  setProgressFilters: (filters: ProgressMatrixFilters) => void;

  // Actions - Retraining & Expiring
  fetchRetrainingTargets: () => Promise<void>;
  fetchExpiringTrainings: (days?: number) => Promise<void>;
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
  // Initial state
  employees: [],
  selectedEmployee: null,
  employeeFilters: {},
  employeeHistory: [],

  programs: [],
  selectedProgram: null,
  programFilters: {},

  sessions: [],
  selectedSession: null,
  sessionFilters: {},

  results: [],
  resultFilters: {},

  dashboardStats: null,
  monthlyData: [],
  gradeDistribution: [],

  progressMatrix: null,
  progressFilters: {},

  retrainingTargets: [],
  expiringTrainings: [],

  loading: {
    employees: false,
    programs: false,
    sessions: false,
    results: false,
    dashboard: false,
    progressMatrix: false,
    progress: false,
    retraining: false,
  },

  // Employee Actions
  fetchEmployees: async (filters) => {
    set((state) => ({ loading: { ...state.loading, employees: true } }));
    try {
      const mergedFilters = { ...get().employeeFilters, ...filters };
      const employees = await api.getEmployees(mergedFilters);
      set({ employees, employeeFilters: mergedFilters });
    } finally {
      set((state) => ({ loading: { ...state.loading, employees: false } }));
    }
  },

  fetchEmployee: async (id) => {
    const employee = await api.getEmployee(id);
    set({ selectedEmployee: employee });
  },

  fetchEmployeeHistory: async (id) => {
    const history = await api.getEmployeeHistory(id);
    set({ employeeHistory: history });
  },

  setEmployeeFilters: (filters) => {
    set({ employeeFilters: filters });
    get().fetchEmployees(filters);
  },

  createEmployee: async (employee) => {
    const newEmployee = await api.createEmployee(employee);
    set((state) => ({ employees: [...state.employees, newEmployee] }));
    return newEmployee;
  },

  updateEmployee: async (id, updates) => {
    const updated = await api.updateEmployee(id, updates);
    if (updated) {
      set((state) => ({
        employees: state.employees.map((e) =>
          e.employee_id === id ? updated : e
        ),
        selectedEmployee:
          state.selectedEmployee?.employee_id === id
            ? updated
            : state.selectedEmployee,
      }));
    }
  },

  // Program Actions
  fetchPrograms: async (filters) => {
    set((state) => ({ loading: { ...state.loading, programs: true } }));
    try {
      const mergedFilters = { ...get().programFilters, ...filters };
      const programs = await api.getPrograms(mergedFilters);
      set({ programs, programFilters: mergedFilters });
    } finally {
      set((state) => ({ loading: { ...state.loading, programs: false } }));
    }
  },

  fetchProgram: async (code) => {
    const program = await api.getProgram(code);
    set({ selectedProgram: program });
  },

  setProgramFilters: (filters) => {
    set({ programFilters: filters });
    get().fetchPrograms(filters);
  },

  createProgram: async (program) => {
    const newProgram = await api.createProgram(program);
    set((state) => ({ programs: [...state.programs, newProgram] }));
    return newProgram;
  },

  updateProgram: async (code, updates) => {
    const updated = await api.updateProgram(code, updates);
    if (updated) {
      set((state) => ({
        programs: state.programs.map((p) =>
          p.program_code === code ? updated : p
        ),
        selectedProgram:
          state.selectedProgram?.program_code === code
            ? updated
            : state.selectedProgram,
      }));
    }
  },

  deleteProgram: async (code) => {
    const success = await api.deleteProgram(code);
    if (success) {
      set((state) => ({
        programs: state.programs.map((p) =>
          p.program_code === code ? { ...p, is_active: false } : p
        ),
      }));
    }
  },

  // Session Actions
  fetchSessions: async (filters) => {
    set((state) => ({ loading: { ...state.loading, sessions: true } }));
    try {
      const mergedFilters = { ...get().sessionFilters, ...filters };
      const sessions = await api.getSessions(mergedFilters);
      set({ sessions, sessionFilters: mergedFilters });
    } finally {
      set((state) => ({ loading: { ...state.loading, sessions: false } }));
    }
  },

  setSessionFilters: (filters) => {
    set({ sessionFilters: filters });
    get().fetchSessions(filters);
  },

  createSession: async (session) => {
    const newSession = await api.createSession(session);
    set((state) => ({ sessions: [...state.sessions, newSession] }));
    return newSession;
  },

  updateSession: async (id, updates) => {
    const updated = await api.updateSession(id, updates);
    if (updated) {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.session_id === id ? updated : s
        ),
        selectedSession:
          state.selectedSession?.session_id === id
            ? updated
            : state.selectedSession,
      }));
    }
  },

  cancelSession: async (id) => {
    const success = await api.cancelSession(id);
    if (success) {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.session_id === id ? { ...s, status: 'CANCELLED' as const } : s
        ),
      }));
    }
  },

  // Result Actions
  fetchResults: async (filters) => {
    set((state) => ({ loading: { ...state.loading, results: true } }));
    try {
      const mergedFilters = { ...get().resultFilters, ...filters };
      const results = await api.getResults(mergedFilters);
      set({ results, resultFilters: mergedFilters });
    } finally {
      set((state) => ({ loading: { ...state.loading, results: false } }));
    }
  },

  setResultFilters: (filters) => {
    set({ resultFilters: filters });
    get().fetchResults(filters);
  },

  recordResults: async (results) => {
    const newResults = await api.recordResults(results);
    set((state) => ({ results: [...newResults, ...state.results] }));
    return newResults;
  },

  updateResult: async (resultId, updates, editReason) => {
    const updated = await api.updateResult({ result_id: resultId, ...updates, edit_reason: editReason });
    if (updated) {
      set((state) => ({
        results: state.results.map((r) =>
          r.result_id === resultId ? updated : r
        ),
        employeeHistory: state.employeeHistory.map((r) =>
          r.result_id === resultId ? updated : r
        ),
      }));
    }
  },

  // Dashboard Actions
  fetchDashboardStats: async () => {
    set((state) => ({ loading: { ...state.loading, dashboard: true } }));
    try {
      const stats = await api.getDashboardStats();
      set({ dashboardStats: stats });
    } finally {
      set((state) => ({ loading: { ...state.loading, dashboard: false } }));
    }
  },

  fetchMonthlyData: async () => {
    const data = await api.getMonthlyTrainingData();
    set({ monthlyData: data });
  },

  fetchGradeDistribution: async () => {
    const data = await api.getGradeDistribution();
    set({ gradeDistribution: data });
  },

  // Progress Matrix Actions
  fetchProgressMatrix: async (filters) => {
    set((state) => ({ loading: { ...state.loading, progressMatrix: true } }));
    try {
      const mergedFilters = { ...get().progressFilters, ...filters };
      const data = await api.getProgressMatrix(mergedFilters);
      set({ progressMatrix: data, progressFilters: mergedFilters });
    } finally {
      set((state) => ({ loading: { ...state.loading, progressMatrix: false } }));
    }
  },

  setProgressFilters: (filters) => {
    set({ progressFilters: filters });
    get().fetchProgressMatrix(filters);
  },

  // Retraining & Expiring Actions
  fetchRetrainingTargets: async () => {
    set((state) => ({ loading: { ...state.loading, retraining: true } }));
    try {
      const targets = await api.getRetrainingTargets();
      set({ retrainingTargets: targets });
    } finally {
      set((state) => ({ loading: { ...state.loading, retraining: false } }));
    }
  },

  fetchExpiringTrainings: async (days = 30) => {
    const expiring = await api.getExpiringTrainings(days);
    set({ expiringTrainings: expiring });
  },
}));
