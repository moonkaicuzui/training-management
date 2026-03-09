// ============================================================
// Result Slice - Normalized Store
// ============================================================

import type { StateCreator } from 'zustand';
import type {
  NormalizedTrainingResultRecord,
  NormalizedResultFilters,
} from '@/types/normalized';
import type { EmployeeId, ProgramCode, SessionId, ResultId } from '@/types/branded';
import type { ResultFilters } from '@/types';
import type { NormalizedTrainingState } from './types';

import * as api from '@/services/api';
import { normalizeTrainingResults } from '@/types/normalized';

// ============================================================
// Slice Actions
// ============================================================

export interface ResultSliceActions {
  fetchResults: (filters?: NormalizedResultFilters) => Promise<void>;
  getResult: (id: ResultId) => NormalizedTrainingResultRecord | undefined;
  addResult: (result: NormalizedTrainingResultRecord) => void;
  updateResult: (id: ResultId, updates: Partial<NormalizedTrainingResultRecord>) => void;
  setResultFilters: (filters: NormalizedResultFilters) => void;
  getEmployeeHistory: (employeeId: EmployeeId) => NormalizedTrainingResultRecord[];
  getProgramResults: (programCode: ProgramCode) => NormalizedTrainingResultRecord[];
  getSessionResults: (sessionId: SessionId) => NormalizedTrainingResultRecord[];
}

// ============================================================
// Slice Creator
// ============================================================

export const createResultSlice: StateCreator<
  NormalizedTrainingState,
  [['zustand/devtools', never]],
  [],
  ResultSliceActions
> = (set, get) => ({
  fetchResults: async (filters) => {
    set((state) => ({
      error: null,
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
      set({ error: 'Failed to fetch results' });
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

  setResultFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, results: filters },
    }));
    get().fetchResults(filters);
  },

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
});
