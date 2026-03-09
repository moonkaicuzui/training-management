// ============================================================
// Normalized Training Store - Composed from Entity Slices
// ============================================================

import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type {
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
} from '@/types/branded';
import type { ProgressMatrixFilters } from '@/types';

import * as api from '@/services/api';
import {
  normalizeEmployees,
  normalizeTrainingPrograms,
  normalizeTrainingResults,
} from '@/types/normalized';

import type { NormalizedTrainingState, EntityIndexes } from './types';
import { createEmployeeSlice } from './employeeSlice';
import { createProgramSlice } from './programSlice';
import { createSessionSlice } from './sessionSlice';
import { createResultSlice } from './resultSlice';

// Re-export types for convenience
export type { NormalizedTrainingState } from './types';

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
  error: null,
};

// ============================================================
// Store Implementation
// ============================================================

export const useNormalizedTrainingStore = create<NormalizedTrainingState>()(
  devtools(
    (set, get, store) => ({
      ...initialState,

      // ========== Entity Slices ==========
      ...createEmployeeSlice(set, get, store),
      ...createProgramSlice(set, get, store),
      ...createSessionSlice(set, get, store),
      ...createResultSlice(set, get, store),

      // ========== Filter Actions ==========

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
          error: null,
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
          set({ error: 'Failed to fetch dashboard stats' });
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
        set({ error: null });
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
          set({ error: 'Failed to fetch monthly data' });
          throw error;
        }
      },

      fetchGradeDistribution: async () => {
        set({ error: null });
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
          set({ error: 'Failed to fetch grade distribution' });
          throw error;
        }
      },

      // ========== Progress Matrix Actions ==========

      fetchProgressMatrix: async (filters) => {
        set((state) => ({
          error: null,
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
          const matrix: Record<EmployeeId, Record<ProgramCode, NormalizedProgressCell>> = {} as Record<EmployeeId, Record<ProgramCode, NormalizedProgressCell>>;
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
          set({ error: 'Failed to fetch progress matrix' });
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
          error: null,
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
          set({ error: 'Failed to fetch retraining targets' });
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
        set({ error: null });
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
          set({ error: 'Failed to fetch expiring trainings' });
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
            const empResults = newIndexes.resultsByEmployee.get(result.employee_id) || new Set();
            empResults.add(result.result_id);
            newIndexes.resultsByEmployee.set(result.employee_id, empResults);

            const progResults = newIndexes.resultsByProgram.get(result.program_code) || new Set();
            progResults.add(result.result_id);
            newIndexes.resultsByProgram.set(result.program_code, progResults);

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

      clearError: () => {
        set({ error: null });
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
// ============================================================

/**
 * Dashboard data selector (legacy compatible)
 */
export const useDashboardData = () =>
  useNormalizedTrainingStore(
    useShallow((state) => ({
      dashboardStats: state.derived.dashboard.stats,
      monthlyData: state.derived.dashboard.monthlyData,
      gradeDistribution: state.derived.dashboard.gradeDistribution,
      retrainingTargets: state.derived.retraining.targets,
      expiringTrainings: state.derived.retraining.expiring,
      loading: state.loading.views.dashboard,
    }))
  );

/**
 * Employees data selector (legacy compatible)
 */
export const useEmployeesData = () => {
  const employeesMap = useNormalizedTrainingStore((state) => state.entities.employees);
  const loading = useNormalizedTrainingStore((state) => state.loading.entities.employees);
  const filters = useNormalizedTrainingStore((state) => state.filters.employees);

  const employees = useMemo(
    () => Array.from(employeesMap.values()),
    [employeesMap]
  );

  return { employees, loading, filters };
};

/**
 * Programs data selector (legacy compatible)
 */
export const useProgramsData = () => {
  const programsMap = useNormalizedTrainingStore((state) => state.entities.programs);
  const loading = useNormalizedTrainingStore((state) => state.loading.entities.programs);
  const filters = useNormalizedTrainingStore((state) => state.filters.programs);

  const programs = useMemo(
    () => Array.from(programsMap.values()),
    [programsMap]
  );

  return { programs, loading, filters };
};

/**
 * Sessions data selector (legacy compatible)
 */
export const useSessionsData = () => {
  const sessionsMap = useNormalizedTrainingStore((state) => state.entities.sessions);
  const loading = useNormalizedTrainingStore((state) => state.loading.entities.sessions);
  const filters = useNormalizedTrainingStore((state) => state.filters.sessions);

  const sessions = useMemo(
    () => Array.from(sessionsMap.values()),
    [sessionsMap]
  );

  return { sessions, loading, filters };
};

/**
 * Results data selector (legacy compatible)
 */
export const useResultsData = () => {
  const resultsMap = useNormalizedTrainingStore((state) => state.entities.results);
  const loading = useNormalizedTrainingStore((state) => state.loading.entities.results);
  const filters = useNormalizedTrainingStore((state) => state.filters.results);

  const results = useMemo(
    () => Array.from(resultsMap.values()),
    [resultsMap]
  );

  return { results, loading, filters };
};

/**
 * Progress matrix data selector (legacy compatible)
 */
export const useProgressMatrixData = () =>
  useNormalizedTrainingStore(
    useShallow((state) => ({
      progressMatrix: state.derived.progressMatrix,
      loading: state.loading.views.progressMatrix,
      filters: state.filters.progressMatrix,
    }))
  );

/**
 * Retraining data selector (legacy compatible)
 */
export const useRetrainingData = () =>
  useNormalizedTrainingStore(
    useShallow((state) => ({
      retrainingTargets: state.derived.retraining.targets,
      expiringTrainings: state.derived.retraining.expiring,
      loading: state.loading.views.retraining,
    }))
  );
