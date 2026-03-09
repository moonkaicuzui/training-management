import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
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
  expiredTrainings: ExpiringTraining[];

  // Error state
  error: string | null;

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

  // Actions - Error
  clearError: () => void;
  clearAllData: () => void;

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
  fetchExpiredTrainings: () => Promise<void>;
}

export const useTrainingStore = create<TrainingState>()(
  devtools((set, get) => ({
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
  expiredTrainings: [],

  error: null,

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

  // Error Actions
  clearError: () => set({ error: null }),

  clearAllData: () => set({
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
    expiredTrainings: [],
    error: null,
  }),

  // Employee Actions
  fetchEmployees: async (filters) => {
    set((state) => ({ loading: { ...state.loading, employees: true }, error: null }));
    try {
      const mergedFilters = { ...get().employeeFilters, ...filters };
      const employees = await api.getEmployees(mergedFilters);
      set({ employees, employeeFilters: mergedFilters });
    } catch (error) {
      set({ error: '직원 목록을 불러오는데 실패했습니다.' });
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, employees: false } }));
    }
  },

  fetchEmployee: async (id) => {
    set({ error: null });
    try {
      const employee = await api.getEmployee(id);
      set({ selectedEmployee: employee });
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      set({ error: '직원 정보를 불러오는데 실패했습니다.' });
      throw error;
    }
  },

  fetchEmployeeHistory: async (id) => {
    set({ error: null });
    try {
      const history = await api.getEmployeeHistory(id);
      set({ employeeHistory: history });
    } catch (error) {
      console.error('Failed to fetch employee history:', error);
      set({ error: '직원 교육 이력을 불러오는데 실패했습니다.' });
      throw error;
    }
  },

  setEmployeeFilters: (filters) => {
    set({ employeeFilters: filters });
    get().fetchEmployees(filters);
  },

  createEmployee: async (employee) => {
    set({ error: null });
    try {
      const newEmployee = await api.createEmployee(employee);
      set((state) => ({ employees: [...state.employees, newEmployee] }));
      return newEmployee;
    } catch (error) {
      console.error('Failed to create employee:', error);
      set({ error: '직원 등록에 실패했습니다.' });
      throw error;
    }
  },

  updateEmployee: async (id, updates) => {
    set({ error: null });
    try {
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
    } catch (error) {
      console.error('Failed to update employee:', error);
      set({ error: '직원 정보 수정에 실패했습니다.' });
      throw error;
    }
  },

  // Program Actions
  fetchPrograms: async (filters) => {
    set((state) => ({ loading: { ...state.loading, programs: true }, error: null }));
    try {
      const mergedFilters = { ...get().programFilters, ...filters };
      const programs = await api.getPrograms(mergedFilters);
      set({ programs, programFilters: mergedFilters });
    } catch (error) {
      set({ error: '교육 프로그램을 불러오는데 실패했습니다.' });
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, programs: false } }));
    }
  },

  fetchProgram: async (code) => {
    set({ error: null });
    try {
      const program = await api.getProgram(code);
      set({ selectedProgram: program });
    } catch (error) {
      console.error('Failed to fetch program:', error);
      set({ error: '교육 프로그램을 불러오는데 실패했습니다.' });
      throw error;
    }
  },

  setProgramFilters: (filters) => {
    set({ programFilters: filters });
    get().fetchPrograms(filters);
  },

  createProgram: async (program) => {
    set({ error: null });
    try {
      const newProgram = await api.createProgram(program);
      set((state) => ({ programs: [...state.programs, newProgram] }));
      return newProgram;
    } catch (error) {
      console.error('Failed to create program:', error);
      set({ error: '교육 프로그램 생성에 실패했습니다.' });
      throw error;
    }
  },

  updateProgram: async (code, updates) => {
    set({ error: null });
    try {
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
    } catch (error) {
      console.error('Failed to update program:', error);
      set({ error: '교육 프로그램 수정에 실패했습니다.' });
      throw error;
    }
  },

  deleteProgram: async (code) => {
    set({ error: null });
    try {
      const success = await api.deleteProgram(code);
      if (success) {
        set((state) => ({
          programs: state.programs.map((p) =>
            p.program_code === code ? { ...p, is_active: false } : p
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to delete program:', error);
      set({ error: '교육 프로그램 삭제에 실패했습니다.' });
      throw error;
    }
  },

  // Session Actions
  fetchSessions: async (filters) => {
    set((state) => ({ loading: { ...state.loading, sessions: true }, error: null }));
    try {
      const mergedFilters = { ...get().sessionFilters, ...filters };
      const sessions = await api.getSessions(mergedFilters);
      set({ sessions, sessionFilters: mergedFilters });
    } catch (error) {
      set({ error: '교육 세션을 불러오는데 실패했습니다.' });
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, sessions: false } }));
    }
  },

  setSessionFilters: (filters) => {
    set({ sessionFilters: filters });
    get().fetchSessions(filters);
  },

  createSession: async (session) => {
    set({ error: null });
    try {
      const newSession = await api.createSession(session);
      set((state) => ({ sessions: [...state.sessions, newSession] }));
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      set({ error: '교육 세션 생성에 실패했습니다.' });
      throw error;
    }
  },

  updateSession: async (id, updates) => {
    set({ error: null });
    try {
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
    } catch (error) {
      console.error('Failed to update session:', error);
      set({ error: '교육 세션 수정에 실패했습니다.' });
      throw error;
    }
  },

  cancelSession: async (id) => {
    set({ error: null });
    try {
      const success = await api.cancelSession(id);
      if (success) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.session_id === id ? { ...s, status: 'CANCELLED' as const } : s
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to cancel session:', error);
      set({ error: '교육 세션 취소에 실패했습니다.' });
      throw error;
    }
  },

  // Result Actions
  fetchResults: async (filters) => {
    set((state) => ({ loading: { ...state.loading, results: true }, error: null }));
    try {
      const mergedFilters = { ...get().resultFilters, ...filters };
      const results = await api.getResults(mergedFilters);
      set({ results, resultFilters: mergedFilters });
    } catch (error) {
      set({ error: '교육 결과를 불러오는데 실패했습니다.' });
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, results: false } }));
    }
  },

  setResultFilters: (filters) => {
    set({ resultFilters: filters });
    get().fetchResults(filters);
  },

  recordResults: async (results) => {
    set({ error: null });
    try {
      const newResults = await api.recordResults(results);
      set((state) => ({ results: [...newResults, ...state.results] }));
      return newResults;
    } catch (error) {
      console.error('Failed to record results:', error);
      set({ error: '교육 결과 기록에 실패했습니다.' });
      throw error;
    }
  },

  updateResult: async (resultId, updates, editReason) => {
    set({ error: null });
    try {
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
    } catch (error) {
      console.error('Failed to update result:', error);
      set({ error: '교육 결과 수정에 실패했습니다.' });
      throw error;
    }
  },

  // Dashboard Actions
  fetchDashboardStats: async () => {
    set((state) => ({ loading: { ...state.loading, dashboard: true }, error: null }));
    try {
      const stats = await api.getDashboardStats();
      set({ dashboardStats: stats });
    } catch (error) {
      set({ error: '대시보드 데이터를 불러오는데 실패했습니다.' });
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, dashboard: false } }));
    }
  },

  fetchMonthlyData: async () => {
    set({ error: null });
    try {
      const data = await api.getMonthlyTrainingData();
      set({ monthlyData: data });
    } catch (error) {
      console.error('Failed to fetch monthly data:', error);
      set({ error: '월별 교육 데이터를 불러오는데 실패했습니다.' });
      throw error;
    }
  },

  fetchGradeDistribution: async () => {
    set({ error: null });
    try {
      const data = await api.getGradeDistribution();
      set({ gradeDistribution: data });
    } catch (error) {
      console.error('Failed to fetch grade distribution:', error);
      set({ error: '등급 분포를 불러오는데 실패했습니다.' });
      throw error;
    }
  },

  // Progress Matrix Actions
  fetchProgressMatrix: async (filters) => {
    set((state) => ({ loading: { ...state.loading, progressMatrix: true }, error: null }));
    try {
      const mergedFilters = { ...get().progressFilters, ...filters };
      const data = await api.getProgressMatrix(mergedFilters);
      set({ progressMatrix: data, progressFilters: mergedFilters });
    } catch (error) {
      set({ error: '진도 매트릭스를 불러오는데 실패했습니다.' });
      throw error;
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
    set((state) => ({ loading: { ...state.loading, retraining: true }, error: null }));
    try {
      const targets = await api.getRetrainingTargets();
      set({ retrainingTargets: targets });
    } catch (error) {
      set({ error: '재교육 대상자를 불러오는데 실패했습니다.' });
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, retraining: false } }));
    }
  },

  fetchExpiringTrainings: async (days = 30) => {
    try {
      const expiring = await api.getExpiringTrainings(days);
      set({ expiringTrainings: expiring });
    } catch (error) {
      set({ error: '만료 예정 교육을 불러오는데 실패했습니다.' });
      throw error;
    }
  },

  fetchExpiredTrainings: async () => {
    try {
      const expired = await api.getExpiredTrainings();
      set({ expiredTrainings: expired });
    } catch (error) {
      set({ error: '만료된 교육을 불러오는데 실패했습니다.' });
      throw error;
    }
  },
}), { name: 'TrainingStore' }));
