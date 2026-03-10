import type { ResultFilters } from '@/types';
import * as api from '@/services/api';
import { logger } from '@/utils/logger';
import i18n from '@/i18n';
import type { StoreSet, StoreGet } from './types';

export const createResultActions = (set: StoreSet, get: StoreGet) => ({
  fetchResults: async (filters?: ResultFilters) => {
    set((state) => ({ loading: { ...state.loading, results: true }, error: null }));
    try {
      const mergedFilters = { ...get().resultFilters, ...filters };
      const results = await api.getResults(mergedFilters);
      set({ results, resultFilters: mergedFilters });
    } catch (error) {
      set({ error: i18n.t('errors.training.fetchResultsFailed') });
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, results: false } }));
    }
  },

  setResultFilters: (filters: ResultFilters) => {
    set({ resultFilters: filters });
    get().fetchResults(filters);
  },

  recordResults: async (results: Parameters<typeof api.recordResults>[0]) => {
    set({ error: null });
    try {
      const newResults = await api.recordResults(results);
      set((state) => ({ results: [...newResults, ...state.results] }));
      return newResults;
    } catch (error) {
      logger.error('Failed to record results:', error);
      set({ error: i18n.t('errors.training.recordResultsFailed') });
      throw error;
    }
  },

  updateResult: async (resultId: string, updates: { score?: number | null; result?: 'PASS' | 'FAIL' | 'ABSENT'; remarks?: string }, editReason: string) => {
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
      logger.error('Failed to update result:', error);
      set({ error: i18n.t('errors.training.updateResultFailed') });
      throw error;
    }
  },
});
