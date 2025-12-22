// ============================================================
// Normalized Training Store
// Improved version with better state management
// ============================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  NormalizedEmployee,
  NormalizedEmployeeFilters,
  NormalizedTrainingProgram,
  NormalizedProgramFilters,
  NormalizedTrainingSession,
  NormalizedSessionFilters,
  NormalizedTrainingResultRecord,
  NormalizedResultFilters,
  NormalizedProgressMatrixData,
  NormalizedProgressMatrixFilters,
  NormalizedProgressCell,
  NormalizedRetrainingTarget,
  NormalizedExpiringTraining,
  TrainingStatus,
  RetrainingReason,
} from '@/types/normalized';
import type { ISODate } from '@/types/datetime';
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
  EmployeeFilters,
  ProgramFilters,
  SessionFilters,
  ResultFilters,
  ProgressMatrixFilters,
} from '@/types';

import * as api from '@/services/api';
import {
  normalizeEmployees,
  normalizeTrainingPrograms,
  normalizeTrainingSessions,
  normalizeTrainingResults,
} from '@/types/normalized';

// ============================================================
// State Structure (Normalized)
// ============================================================

/**
 * Normalized entities stored in maps for efficient lookup
 */
interface NormalizedEntities {
  employees: Map<EmployeeId, NormalizedEmployee>;
  programs: Map<ProgramCode, NormalizedTrainingProgram>;
  sessions: Map<SessionId, NormalizedTrainingSession>;
  results: Map<ResultId, NormalizedTrainingResultRecord>;
}

/**
 * Index structures for efficient querying
 */
interface EntityIndexes {
  // Results by employee
  resultsByEmployee: Map<EmployeeId, Set<ResultId>>;

  // Results by program
  resultsByProgram: Map<ProgramCode, Set<ResultId>>;

  // Sessions by program
  sessionsByProgram: Map<ProgramCode, Set<SessionId>>;

  // Results by session
  resultsBySession: Map<SessionId, Set<ResultId>>;
}

/**
 * UI State (separated from data)
 */
interface UIState {
  selectedEmployeeId: EmployeeId | null;
  selectedProgramCode: ProgramCode | null;
  selectedSessionId: SessionId | null;
}

/**
 * Filter State (centralized)
 */
interface FilterState {
  employees: NormalizedEmployeeFilters;
  programs: NormalizedProgramFilters;
  sessions: NormalizedSessionFilters;
  results: NormalizedResultFilters;
  progressMatrix: NormalizedProgressMatrixFilters;
}

/**
 * Loading State (fine-grained)
 */
interface LoadingState {
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
interface DerivedData {
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
// Store State
// ============================================================

interface NormalizedTrainingState {
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

  // ========== Entity Actions ==========

  // Employees
  fetchEmployees: (filters?: NormalizedEmployeeFilters) => Promise<void>;
  getEmployee: (id: EmployeeId) => NormalizedEmployee | undefined;
  setSelectedEmployee: (id: EmployeeId | null) => void;
  addEmployee: (employee: NormalizedEmployee) => void;
  updateEmployee: (id: EmployeeId, updates: Partial<NormalizedEmployee>) => void;

  // Programs
  fetchPrograms: (filters?: NormalizedProgramFilters) => Promise<void>;
  getProgram: (code: ProgramCode) => NormalizedTrainingProgram | undefined;
  setSelectedProgram: (code: ProgramCode | null) => void;
  addProgram: (program: NormalizedTrainingProgram) => void;
  updateProgram: (code: ProgramCode, updates: Partial<NormalizedTrainingProgram>) => void;
  deactivateProgram: (code: ProgramCode) => void;

  // Sessions
  fetchSessions: (filters?: NormalizedSessionFilters) => Promise<void>;
  getSession: (id: SessionId) => NormalizedTrainingSession | undefined;
  setSelectedSession: (id: SessionId | null) => void;
  addSession: (session: NormalizedTrainingSession) => void;
  updateSession: (id: SessionId, updates: Partial<NormalizedTrainingSession>) => void;
  cancelSession: (id: SessionId) => void;

  // Results
  fetchResults: (filters?: NormalizedResultFilters) => Promise<void>;
  getResult: (id: ResultId) => NormalizedTrainingResultRecord | undefined;
  addResult: (result: NormalizedTrainingResultRecord) => void;
  updateResult: (id: ResultId, updates: Partial<NormalizedTrainingResultRecord>) => void;

  // ========== Query Actions ==========

  // Get employee's training history
  getEmployeeHistory: (employeeId: EmployeeId) => NormalizedTrainingResultRecord[];

  // Get program's training results
  getProgramResults: (programCode: ProgramCode) => NormalizedTrainingResultRecord[];

  // Get session results
  getSessionResults: (sessionId: SessionId) => NormalizedTrainingResultRecord[];

  // Get sessions for program
  getProgramSessions: (programCode: ProgramCode) => NormalizedTrainingSession[];

  // ========== Filter Actions ==========

  setEmployeeFilters: (filters: NormalizedEmployeeFilters) => void;
  setProgramFilters: (filters: NormalizedProgramFilters) => void;
  setSessionFilters: (filters: NormalizedSessionFilters) => void;
  setResultFilters: (filters: NormalizedResultFilters) => void;
  setProgressFilters: (filters: NormalizedProgressMatrixFilters) => void;
  clearAllFilters: () => void;

  // ========== Dashboard Actions ==========

  fetchDashboardStats: () => Promise<void>;
  fetchMonthlyData: () => Promise<void>;
  fetchGradeDistribution: () => Promise<void>;

  // ========== Progress Matrix Actions ==========

  fetchProgressMatrix: (filters?: NormalizedProgressMatrixFilters) => Promise<void>;

  // ========== Retraining Actions ==========

  fetchRetrainingTargets: () => Promise<void>;
  fetchExpiringTrainings: (days?: number) => Promise<void>;

  // ========== Utility Actions ==========

  // Rebuild indexes (after bulk updates)
  rebuildIndexes: () => void;

  // Clear all data (logout/reset)
  clearAllData: () => void;
}

// ============================================================
// Initial State
// ============================================================

const initialState = {
  entities: {
    employees: new Map(),
    programs: new Map(),
    sessions: new Map(),
    results: new Map(),
  },
  indexes: {
    resultsByEmployee: new Map(),
    resultsByProgram: new Map(),
    sessionsByProgram: new Map(),
    resultsBySession: new Map(),
  },
  ui: {
    selectedEmployeeId: null,
    selectedProgramCode: null,
    selectedSessionId: null,
  },
  filters: {
    employees: {},
    programs: {},
    sessions: {},
    results: {},
    progressMatrix: {},
  },
  loading: {
    entities: {
      employees: false,
      programs: false,
      sessions: false,
      results: false,
    },
    views: {
      dashboard: false,
      progressMatrix: false,
      retraining: false,
    },
  },
  derived: {
    dashboard: {
      stats: null,
      monthlyData: [],
      gradeDistribution: [],
    },
    progressMatrix: null,
    retraining: {
      targets: [],
      expiring: [],
    },
  },
};

// ============================================================
// Store Implementation
// ============================================================

export const useNormalizedTrainingStore = create<NormalizedTrainingState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ========== Entity Actions ==========

      fetchEmployees: async (filters) => {
        set((state) => ({
          loading: {
            ...state.loading,
            entities: { ...state.loading.entities, employees: true },
          },
        }));

        try {
          // Convert normalized filters to legacy filters
          const legacyFilters: EmployeeFilters = filters ? {
            department: filters.department,
            position: filters.position,
            building: filters.building,
            line: filters.line,
            status: filters.status,
            search: filters.search,
          } : {};

          const rawEmployees = await api.getEmployees(legacyFilters);
          const employees = normalizeEmployees(rawEmployees);

          // Update entities map
          const employeeMap = new Map<EmployeeId, NormalizedEmployee>();
          employees.forEach(emp => employeeMap.set(emp.employee_id, emp));

          set((state) => ({
            entities: { ...state.entities, employees: employeeMap },
            filters: { ...state.filters, employees: filters || {} },
          }));
        } catch (error) {
          console.error('Failed to fetch employees:', error);
          throw error;
        } finally {
          set((state) => ({
            loading: {
              ...state.loading,
              entities: { ...state.loading.entities, employees: false },
            },
          }));
        }
      },

      getEmployee: (id) => {
        return get().entities.employees.get(id);
      },

      setSelectedEmployee: (id) => {
        set((state) => ({
          ui: { ...state.ui, selectedEmployeeId: id },
        }));
      },

      addEmployee: (employee) => {
        set((state) => {
          const newEmployees = new Map(state.entities.employees);
          newEmployees.set(employee.employee_id, employee);
          return {
            entities: { ...state.entities, employees: newEmployees },
          };
        });
      },

      updateEmployee: (id, updates) => {
        set((state) => {
          const employee = state.entities.employees.get(id);
          if (!employee) return state;

          const updated = { ...employee, ...updates };
          const newEmployees = new Map(state.entities.employees);
          newEmployees.set(id, updated);

          return {
            entities: { ...state.entities, employees: newEmployees },
          };
        });
      },

      // Programs
      fetchPrograms: async (filters) => {
        set((state) => ({
          loading: {
            ...state.loading,
            entities: { ...state.loading.entities, programs: true },
          },
        }));

        try {
          const legacyFilters: ProgramFilters = filters ? {
            category: filters.category,
            showInactive: filters.showInactive,
            search: filters.search,
            tags: filters.tags ? [...filters.tags] : undefined,
          } : {};

          const rawPrograms = await api.getPrograms(legacyFilters);
          const programs = normalizeTrainingPrograms(rawPrograms);

          const programMap = new Map<ProgramCode, NormalizedTrainingProgram>();
          programs.forEach(prog => programMap.set(prog.program_code, prog));

          set((state) => ({
            entities: { ...state.entities, programs: programMap },
            filters: { ...state.filters, programs: filters || {} },
          }));
        } catch (error) {
          console.error('Failed to fetch programs:', error);
          throw error;
        } finally {
          set((state) => ({
            loading: {
              ...state.loading,
              entities: { ...state.loading.entities, programs: false },
            },
          }));
        }
      },

      getProgram: (code) => {
        return get().entities.programs.get(code);
      },

      setSelectedProgram: (code) => {
        set((state) => ({
          ui: { ...state.ui, selectedProgramCode: code },
        }));
      },

      addProgram: (program) => {
        set((state) => {
          const newPrograms = new Map(state.entities.programs);
          newPrograms.set(program.program_code, program);
          return {
            entities: { ...state.entities, programs: newPrograms },
          };
        });
      },

      updateProgram: (code, updates) => {
        set((state) => {
          const program = state.entities.programs.get(code);
          if (!program) return state;

          const updated = { ...program, ...updates };
          const newPrograms = new Map(state.entities.programs);
          newPrograms.set(code, updated);

          return {
            entities: { ...state.entities, programs: newPrograms },
          };
        });
      },

      deactivateProgram: (code) => {
        get().updateProgram(code, { is_active: false });
      },

      // Sessions
      fetchSessions: async (filters) => {
        set((state) => ({
          loading: {
            ...state.loading,
            entities: { ...state.loading.entities, sessions: true },
          },
        }));

        try {
          const legacyFilters: SessionFilters = filters ? {
            startDate: filters.startDate,
            endDate: filters.endDate,
            programCode: filters.programCode,
            status: filters.status,
          } : {};

          const rawSessions = await api.getSessions(legacyFilters);
          const sessions = normalizeTrainingSessions(rawSessions);

          const sessionMap = new Map<SessionId, NormalizedTrainingSession>();
          const sessionsByProgram = new Map<ProgramCode, Set<SessionId>>();

          sessions.forEach(sess => {
            sessionMap.set(sess.session_id, sess);

            // Build index
            const programSessions = sessionsByProgram.get(sess.program_code) || new Set();
            programSessions.add(sess.session_id);
            sessionsByProgram.set(sess.program_code, programSessions);
          });

          set((state) => ({
            entities: { ...state.entities, sessions: sessionMap },
            indexes: { ...state.indexes, sessionsByProgram },
            filters: { ...state.filters, sessions: filters || {} },
          }));
        } catch (error) {
          console.error('Failed to fetch sessions:', error);
          throw error;
        } finally {
          set((state) => ({
            loading: {
              ...state.loading,
              entities: { ...state.loading.entities, sessions: false },
            },
          }));
        }
      },

      getSession: (id) => {
        return get().entities.sessions.get(id);
      },

      setSelectedSession: (id) => {
        set((state) => ({
          ui: { ...state.ui, selectedSessionId: id },
        }));
      },

      addSession: (session) => {
        set((state) => {
          const newSessions = new Map(state.entities.sessions);
          newSessions.set(session.session_id, session);

          // Update index
          const newSessionsByProgram = new Map(state.indexes.sessionsByProgram);
          const programSessions = newSessionsByProgram.get(session.program_code) || new Set();
          programSessions.add(session.session_id);
          newSessionsByProgram.set(session.program_code, programSessions);

          return {
            entities: { ...state.entities, sessions: newSessions },
            indexes: { ...state.indexes, sessionsByProgram: newSessionsByProgram },
          };
        });
      },

      updateSession: (id, updates) => {
        set((state) => {
          const session = state.entities.sessions.get(id);
          if (!session) return state;

          const updated = { ...session, ...updates };
          const newSessions = new Map(state.entities.sessions);
          newSessions.set(id, updated);

          return {
            entities: { ...state.entities, sessions: newSessions },
          };
        });
      },

      cancelSession: (id) => {
        get().updateSession(id, { status: 'CANCELLED' });
      },

      // Results
      fetchResults: async (filters) => {
        set((state) => ({
          loading: {
            ...state.loading,
            entities: { ...state.loading.entities, results: true },
          },
        }));

        try {
          const legacyFilters: ResultFilters = filters ? {
            employeeId: filters.employeeId,
            programCode: filters.programCode,
            startDate: filters.startDate,
            endDate: filters.endDate,
            result: filters.result,
            grade: filters.grade,
          } : {};

          const rawResults = await api.getResults(legacyFilters);
          const results = normalizeTrainingResults(rawResults);

          const resultMap = new Map<ResultId, NormalizedTrainingResultRecord>();
          const resultsByEmployee = new Map<EmployeeId, Set<ResultId>>();
          const resultsByProgram = new Map<ProgramCode, Set<ResultId>>();
          const resultsBySession = new Map<SessionId, Set<ResultId>>();

          results.forEach(result => {
            resultMap.set(result.result_id, result);

            // Build indexes
            const empResults = resultsByEmployee.get(result.employee_id) || new Set();
            empResults.add(result.result_id);
            resultsByEmployee.set(result.employee_id, empResults);

            const progResults = resultsByProgram.get(result.program_code) || new Set();
            progResults.add(result.result_id);
            resultsByProgram.set(result.program_code, progResults);

            if (result.session_id) {
              const sessResults = resultsBySession.get(result.session_id) || new Set();
              sessResults.add(result.result_id);
              resultsBySession.set(result.session_id, sessResults);
            }
          });

          set((state) => ({
            entities: { ...state.entities, results: resultMap },
            indexes: {
              ...state.indexes,
              resultsByEmployee,
              resultsByProgram,
              resultsBySession,
            },
            filters: { ...state.filters, results: filters || {} },
          }));
        } catch (error) {
          console.error('Failed to fetch results:', error);
          throw error;
        } finally {
          set((state) => ({
            loading: {
              ...state.loading,
              entities: { ...state.loading.entities, results: false },
            },
          }));
        }
      },

      getResult: (id) => {
        return get().entities.results.get(id);
      },

      addResult: (result) => {
        set((state) => {
          const newResults = new Map(state.entities.results);
          newResults.set(result.result_id, result);

          // Update indexes
          const newIndexes = { ...state.indexes };

          // By employee
          const empResults = newIndexes.resultsByEmployee.get(result.employee_id) || new Set();
          empResults.add(result.result_id);
          newIndexes.resultsByEmployee = new Map(newIndexes.resultsByEmployee);
          newIndexes.resultsByEmployee.set(result.employee_id, empResults);

          // By program
          const progResults = newIndexes.resultsByProgram.get(result.program_code) || new Set();
          progResults.add(result.result_id);
          newIndexes.resultsByProgram = new Map(newIndexes.resultsByProgram);
          newIndexes.resultsByProgram.set(result.program_code, progResults);

          // By session
          if (result.session_id) {
            const sessResults = newIndexes.resultsBySession.get(result.session_id) || new Set();
            sessResults.add(result.result_id);
            newIndexes.resultsBySession = new Map(newIndexes.resultsBySession);
            newIndexes.resultsBySession.set(result.session_id, sessResults);
          }

          return {
            entities: { ...state.entities, results: newResults },
            indexes: newIndexes,
          };
        });
      },

      updateResult: (id, updates) => {
        set((state) => {
          const result = state.entities.results.get(id);
          if (!result) return state;

          const updated = { ...result, ...updates };
          const newResults = new Map(state.entities.results);
          newResults.set(id, updated);

          return {
            entities: { ...state.entities, results: newResults },
          };
        });
      },

      // ========== Query Actions ==========

      getEmployeeHistory: (employeeId) => {
        const resultIds = get().indexes.resultsByEmployee.get(employeeId) || new Set();
        const results: NormalizedTrainingResultRecord[] = [];

        resultIds.forEach((id) => {
          const result = get().entities.results.get(id);
          if (result) results.push(result);
        });

        // Sort by date descending
        return results.sort((a, b) =>
          b.training_date.localeCompare(a.training_date)
        );
      },

      getProgramResults: (programCode) => {
        const resultIds = get().indexes.resultsByProgram.get(programCode) || new Set();
        const results: NormalizedTrainingResultRecord[] = [];

        resultIds.forEach((id) => {
          const result = get().entities.results.get(id);
          if (result) results.push(result);
        });

        return results.sort((a, b) =>
          b.training_date.localeCompare(a.training_date)
        );
      },

      getSessionResults: (sessionId) => {
        const resultIds = get().indexes.resultsBySession.get(sessionId) || new Set();
        const results: NormalizedTrainingResultRecord[] = [];

        resultIds.forEach((id) => {
          const result = get().entities.results.get(id);
          if (result) results.push(result);
        });

        return results;
      },

      getProgramSessions: (programCode) => {
        const sessionIds = get().indexes.sessionsByProgram.get(programCode) || new Set();
        const sessions: NormalizedTrainingSession[] = [];

        sessionIds.forEach((id) => {
          const session = get().entities.sessions.get(id);
          if (session) sessions.push(session);
        });

        return sessions.sort((a, b) =>
          b.session_date.localeCompare(a.session_date)
        );
      },

      // ========== Filter Actions ==========

      setEmployeeFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, employees: filters },
        }));
        get().fetchEmployees(filters);
      },

      setProgramFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, programs: filters },
        }));
        get().fetchPrograms(filters);
      },

      setSessionFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, sessions: filters },
        }));
        get().fetchSessions(filters);
      },

      setResultFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, results: filters },
        }));
        get().fetchResults(filters);
      },

      setProgressFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, progressMatrix: filters },
        }));
        get().fetchProgressMatrix(filters);
      },

      clearAllFilters: () => {
        set({
          filters: {
            employees: {},
            programs: {},
            sessions: {},
            results: {},
            progressMatrix: {},
          },
        });
      },

      // ========== Dashboard Actions ==========

      fetchDashboardStats: async () => {
        set((state) => ({
          loading: {
            ...state.loading,
            views: { ...state.loading.views, dashboard: true },
          },
        }));

        try {
          const stats = await api.getDashboardStats();

          set((state) => ({
            derived: {
              ...state.derived,
              dashboard: { ...state.derived.dashboard, stats },
            },
          }));
        } catch (error) {
          console.error('Failed to fetch dashboard stats:', error);
          throw error;
        } finally {
          set((state) => ({
            loading: {
              ...state.loading,
              views: { ...state.loading.views, dashboard: false },
            },
          }));
        }
      },

      fetchMonthlyData: async () => {
        try {
          const monthlyData = await api.getMonthlyTrainingData();

          set((state) => ({
            derived: {
              ...state.derived,
              dashboard: { ...state.derived.dashboard, monthlyData },
            },
          }));
        } catch (error) {
          console.error('Failed to fetch monthly data:', error);
          throw error;
        }
      },

      fetchGradeDistribution: async () => {
        try {
          const gradeDistribution = await api.getGradeDistribution();

          set((state) => ({
            derived: {
              ...state.derived,
              dashboard: { ...state.derived.dashboard, gradeDistribution },
            },
          }));
        } catch (error) {
          console.error('Failed to fetch grade distribution:', error);
          throw error;
        }
      },

      // ========== Progress Matrix Actions ==========

      fetchProgressMatrix: async (filters) => {
        set((state) => ({
          loading: {
            ...state.loading,
            views: { ...state.loading.views, progressMatrix: true },
          },
        }));

        try {
          const legacyFilters: ProgressMatrixFilters = filters ? {
            building: filters.building,
            department: filters.department,
            line: filters.line,
            position: filters.position,
            category: filters.category,
          } : {};

          const rawData = await api.getProgressMatrix(legacyFilters);

          // Normalize the data
          const employees = normalizeEmployees(rawData.employees);
          const programs = normalizeTrainingPrograms(rawData.programs);

          // Build matrix for efficient lookup
          const matrix: Record<EmployeeId, Record<ProgramCode, NormalizedProgressCell>> = {} as any;
          const cells: NormalizedProgressCell[] = [];

          for (const cell of rawData.cells) {
            const empId = cell.employeeId as EmployeeId;
            const progCode = cell.programCode as ProgramCode;

            const normalizedCell: NormalizedProgressCell = {
              employee_id: empId,
              program_code: progCode,
              status: cell.status as TrainingStatus,
              last_result: cell.lastResult?.result || null,
              last_score: cell.lastResult?.score || null,
              last_grade: cell.lastResult?.grade || null,
              last_training_date: cell.lastResult?.training_date as ISODate || null,
              expiration_date: cell.expirationDate as ISODate || null,
              days_until_expiry: cell.expirationDate
                ? Math.ceil((new Date(cell.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null,
              completion_count: 1, // Would need to calculate from full history
            };

            cells.push(normalizedCell);

            if (!matrix[empId]) {
              matrix[empId] = {} as Record<ProgramCode, NormalizedProgressCell>;
            }
            matrix[empId][progCode] = normalizedCell;
          }

          set((state) => ({
            derived: {
              ...state.derived,
              progressMatrix: {
                employees: Object.freeze(employees),
                programs: Object.freeze(programs),
                cells: Object.freeze(cells),
                matrix: Object.freeze(matrix),
              },
            },
            filters: { ...state.filters, progressMatrix: filters || {} },
          }));
        } catch (error) {
          console.error('Failed to fetch progress matrix:', error);
          throw error;
        } finally {
          set((state) => ({
            loading: {
              ...state.loading,
              views: { ...state.loading.views, progressMatrix: false },
            },
          }));
        }
      },

      // ========== Retraining Actions ==========

      fetchRetrainingTargets: async () => {
        set((state) => ({
          loading: {
            ...state.loading,
            views: { ...state.loading.views, retraining: true },
          },
        }));

        try {
          const rawTargets = await api.getRetrainingTargets();

          const targets: NormalizedRetrainingTarget[] = rawTargets.map(target => ({
            employee: normalizeEmployees([target.employee])[0],
            program: normalizeTrainingPrograms([target.program])[0],
            last_result: normalizeTrainingResults([target.lastResult])[0],
            reason: target.reason as RetrainingReason,
            priority: target.reason === 'FAILED' ? 'HIGH' : target.reason === 'EXPIRED' ? 'MEDIUM' : 'LOW',
            recommended_programs: target.recommendedPrograms
              ? Object.freeze(normalizeTrainingPrograms(target.recommendedPrograms))
              : undefined,
          }));

          set((state) => ({
            derived: {
              ...state.derived,
              retraining: { ...state.derived.retraining, targets },
            },
          }));
        } catch (error) {
          console.error('Failed to fetch retraining targets:', error);
          throw error;
        } finally {
          set((state) => ({
            loading: {
              ...state.loading,
              views: { ...state.loading.views, retraining: false },
            },
          }));
        }
      },

      fetchExpiringTrainings: async (days = 30) => {
        try {
          const rawExpiring = await api.getExpiringTrainings(days);

          const expiring: NormalizedExpiringTraining[] = rawExpiring.map(item => ({
            employee: normalizeEmployees([item.employee])[0],
            program: normalizeTrainingPrograms([item.program])[0],
            last_pass_date: item.lastPassDate as ISODate,
            expiration_date: item.expirationDate as ISODate,
            days_until_expiry: item.daysUntilExpiry,
            priority: item.daysUntilExpiry <= 7 ? 'URGENT' : item.daysUntilExpiry <= 14 ? 'SOON' : 'NORMAL',
          }));

          set((state) => ({
            derived: {
              ...state.derived,
              retraining: { ...state.derived.retraining, expiring },
            },
          }));
        } catch (error) {
          console.error('Failed to fetch expiring trainings:', error);
          throw error;
        }
      },

      // ========== Utility Actions ==========

      rebuildIndexes: () => {
        set((state) => {
          const newIndexes: EntityIndexes = {
            resultsByEmployee: new Map(),
            resultsByProgram: new Map(),
            sessionsByProgram: new Map(),
            resultsBySession: new Map(),
          };

          // Rebuild result indexes
          state.entities.results.forEach((result) => {
            // By employee
            const empResults = newIndexes.resultsByEmployee.get(result.employee_id) || new Set();
            empResults.add(result.result_id);
            newIndexes.resultsByEmployee.set(result.employee_id, empResults);

            // By program
            const progResults = newIndexes.resultsByProgram.get(result.program_code) || new Set();
            progResults.add(result.result_id);
            newIndexes.resultsByProgram.set(result.program_code, progResults);

            // By session
            if (result.session_id) {
              const sessResults = newIndexes.resultsBySession.get(result.session_id) || new Set();
              sessResults.add(result.result_id);
              newIndexes.resultsBySession.set(result.session_id, sessResults);
            }
          });

          // Rebuild session indexes
          state.entities.sessions.forEach((session) => {
            const programSessions = newIndexes.sessionsByProgram.get(session.program_code) || new Set();
            programSessions.add(session.session_id);
            newIndexes.sessionsByProgram.set(session.program_code, programSessions);
          });

          return { indexes: newIndexes };
        });
      },

      clearAllData: () => {
        set(initialState);
      },
    }),
    { name: 'NormalizedTrainingStore' }
  )
);

// ============================================================
// Selectors
// ============================================================

/**
 * Get selected employee
 */
export const useSelectedEmployee = () =>
  useNormalizedTrainingStore((state) => {
    const id = state.ui.selectedEmployeeId;
    return id ? state.entities.employees.get(id) : null;
  });

/**
 * Get selected program
 */
export const useSelectedProgram = () =>
  useNormalizedTrainingStore((state) => {
    const code = state.ui.selectedProgramCode;
    return code ? state.entities.programs.get(code) : null;
  });

/**
 * Get all employees as array
 */
export const useEmployeesList = () =>
  useNormalizedTrainingStore((state) =>
    Array.from(state.entities.employees.values())
  );

/**
 * Get all programs as array
 */
export const useProgramsList = () =>
  useNormalizedTrainingStore((state) =>
    Array.from(state.entities.programs.values()).filter(p => p.is_active)
  );

/**
 * Get all sessions as array
 */
export const useSessionsList = () =>
  useNormalizedTrainingStore((state) =>
    Array.from(state.entities.sessions.values())
  );

/**
 * Get all results as array
 */
export const useResultsList = () =>
  useNormalizedTrainingStore((state) =>
    Array.from(state.entities.results.values())
  );

// ============================================================
// Legacy API Compatibility Selectors
// For gradual migration from trainingStore
// ============================================================

/**
 * Dashboard data selector (legacy compatible)
 */
export const useDashboardData = () =>
  useNormalizedTrainingStore((state) => ({
    dashboardStats: state.derived.dashboard.stats,
    monthlyData: state.derived.dashboard.monthlyData,
    gradeDistribution: state.derived.dashboard.gradeDistribution,
    retrainingTargets: state.derived.retraining.targets,
    expiringTrainings: state.derived.retraining.expiring,
    loading: state.loading.views.dashboard,
  }));

/**
 * Employees data selector (legacy compatible)
 */
export const useEmployeesData = () =>
  useNormalizedTrainingStore((state) => ({
    employees: Array.from(state.entities.employees.values()),
    loading: state.loading.entities.employees,
    filters: state.filters.employees,
  }));

/**
 * Programs data selector (legacy compatible)
 */
export const useProgramsData = () =>
  useNormalizedTrainingStore((state) => ({
    programs: Array.from(state.entities.programs.values()),
    loading: state.loading.entities.programs,
    filters: state.filters.programs,
  }));

/**
 * Sessions data selector (legacy compatible)
 */
export const useSessionsData = () =>
  useNormalizedTrainingStore((state) => ({
    sessions: Array.from(state.entities.sessions.values()),
    loading: state.loading.entities.sessions,
    filters: state.filters.sessions,
  }));

/**
 * Results data selector (legacy compatible)
 */
export const useResultsData = () =>
  useNormalizedTrainingStore((state) => ({
    results: Array.from(state.entities.results.values()),
    loading: state.loading.entities.results,
    filters: state.filters.results,
  }));

/**
 * Progress matrix data selector (legacy compatible)
 */
export const useProgressMatrixData = () =>
  useNormalizedTrainingStore((state) => ({
    progressMatrix: state.derived.progressMatrix,
    loading: state.loading.views.progressMatrix,
    filters: state.filters.progressMatrix,
  }));

/**
 * Retraining data selector (legacy compatible)
 */
export const useRetrainingData = () =>
  useNormalizedTrainingStore((state) => ({
    retrainingTargets: state.derived.retraining.targets,
    expiringTrainings: state.derived.retraining.expiring,
    loading: state.loading.views.retraining,
  }));
