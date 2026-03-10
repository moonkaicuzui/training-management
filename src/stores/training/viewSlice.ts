import type { ProgressMatrixFilters } from '@/types';
import * as api from '@/services/api';
import { logger } from '@/utils/logger';
import i18n from '@/i18n';
import type { StoreSet, StoreGet } from './types';

export const createViewActions = (set: StoreSet, get: StoreGet) => ({
  fetchDashboardStats: async () => {
    set((state) => ({ loading: { ...state.loading, dashboard: true }, error: null }));
    try {
      const stats = await api.getDashboardStats();
      set({ dashboardStats: stats });
    } catch (error) {
      set({ error: i18n.t('errors.training.fetchDashboardFailed') });
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
      logger.error('Failed to fetch monthly data:', error);
      set({ error: i18n.t('errors.training.fetchMonthlyDataFailed') });
      throw error;
    }
  },

  fetchGradeDistribution: async () => {
    set({ error: null });
    try {
      const data = await api.getGradeDistribution();
      set({ gradeDistribution: data });
    } catch (error) {
      logger.error('Failed to fetch grade distribution:', error);
      set({ error: i18n.t('errors.training.fetchGradeDistributionFailed') });
      throw error;
    }
  },

  fetchProgressMatrix: async (filters?: ProgressMatrixFilters) => {
    set((state) => ({ loading: { ...state.loading, progressMatrix: true }, error: null }));
    try {
      const mergedFilters = { ...get().progressFilters, ...filters };
      const data = await api.getProgressMatrix(mergedFilters);
      set({ progressMatrix: data, progressFilters: mergedFilters });
    } catch (error) {
      set({ error: i18n.t('errors.training.fetchProgressMatrixFailed') });
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, progressMatrix: false } }));
    }
  },

  setProgressFilters: (filters: ProgressMatrixFilters) => {
    set({ progressFilters: filters });
    get().fetchProgressMatrix(filters);
  },

  fetchRetrainingTargets: async () => {
    set((state) => ({ loading: { ...state.loading, retraining: true }, error: null }));
    try {
      const targets = await api.getRetrainingTargets();
      set({ retrainingTargets: targets });
    } catch (error) {
      set({ error: i18n.t('errors.training.fetchRetrainingTargetsFailed') });
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
      set({ error: i18n.t('errors.training.fetchExpiringTrainingsFailed') });
      throw error;
    }
  },

  fetchExpiredTrainings: async () => {
    try {
      const expired = await api.getExpiredTrainings();
      set({ expiredTrainings: expired });
    } catch (error) {
      set({ error: i18n.t('errors.training.fetchExpiredTrainingsFailed') });
      throw error;
    }
  },
});
