/**
 * Metal Detector Inspection Store
 *
 * Zustand store for Metal Detector inspection management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import * as api from '@/services/api';
import { logger } from '@/utils/logger';
import type {
  MDInspection,
  MDFailure,
  MDFilters,
  MDDashboardKPI,
  MDWeeklyTrend,
} from '@/types/metalDetector';

// ========== Store Interface ==========

interface MDInspectionState {
  // Data
  inspections: MDInspection[];
  failures: MDFailure[];
  dashboardKPIs: MDDashboardKPI | null;
  weeklyTrend: MDWeeklyTrend[];

  // UI State
  isLoading: boolean;
  error: string | null;
  filters: MDFilters;

  // Actions
  fetchInspections: (filters?: MDFilters) => Promise<void>;
  createInspection: (
    data: Omit<MDInspection, 'id' | 'weekNumber' | 'year' | 'createdAt' | 'updatedAt'>
  ) => Promise<MDInspection>;
  updateInspection: (
    id: string,
    data: Partial<Omit<MDInspection, 'id' | 'createdAt'>>
  ) => Promise<void>;
  fetchFailures: (inspectionId?: string) => Promise<void>;
  createFailure: (
    data: Omit<MDFailure, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<MDFailure>;
  updateFailureCA: (
    id: string,
    data: Partial<Omit<MDFailure, 'id' | 'createdAt'>>
  ) => Promise<void>;
  fetchDashboardKPIs: (year: number, weekNumber?: number) => Promise<void>;
  fetchWeeklyTrend: (year: number, weekCount?: number) => Promise<void>;
  setFilters: (filters: MDFilters) => void;
  clearError: () => void;
}

// ========== Store Implementation ==========

export const useMDInspectionStore = create<MDInspectionState>()(
  devtools(
    immer((set) => ({
      // Initial State
      inspections: [],
      failures: [],
      dashboardKPIs: null,
      weeklyTrend: [],
      isLoading: false,
      error: null,
      filters: {},

      // Actions
      fetchInspections: async (filters) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const inspections = await api.mdInspection.getInspections(filters);
          set((state) => {
            state.inspections = inspections;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[MDStore] fetchInspections failed', error);
          set((state) => {
            state.error = '점검 데이터를 불러오는데 실패했습니다.';
            state.isLoading = false;
          });
        }
      },

      createInspection: async (data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const inspection = await api.mdInspection.createInspection(data);
          set((state) => {
            state.inspections.unshift(inspection);
            state.isLoading = false;
          });
          return inspection;
        } catch (error) {
          logger.error('[MDStore] createInspection failed', error);
          set((state) => {
            state.error = '점검 등록에 실패했습니다.';
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateInspection: async (id, data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          await api.mdInspection.updateInspection(id, data);
          set((state) => {
            const idx = state.inspections.findIndex((i) => i.id === id);
            if (idx !== -1) {
              Object.assign(state.inspections[idx], data);
            }
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[MDStore] updateInspection failed', error);
          set((state) => {
            state.error = '점검 수정에 실패했습니다.';
            state.isLoading = false;
          });
          throw error;
        }
      },

      fetchFailures: async (inspectionId) => {
        try {
          const failures = await api.mdInspection.getFailures(inspectionId);
          set((state) => {
            state.failures = failures;
          });
        } catch (error) {
          logger.error('[MDStore] fetchFailures failed', error);
        }
      },

      createFailure: async (data) => {
        try {
          const failure = await api.mdInspection.createFailure(data);
          set((state) => {
            state.failures.unshift(failure);
          });
          return failure;
        } catch (error) {
          logger.error('[MDStore] createFailure failed', error);
          throw error;
        }
      },

      updateFailureCA: async (id, data) => {
        try {
          await api.mdInspection.updateFailure(id, data);
          set((state) => {
            const idx = state.failures.findIndex((f) => f.id === id);
            if (idx !== -1) {
              Object.assign(state.failures[idx], data);
            }
          });
        } catch (error) {
          logger.error('[MDStore] updateFailureCA failed', error);
          throw error;
        }
      },

      fetchDashboardKPIs: async (year, weekNumber) => {
        set((state) => {
          state.isLoading = true;
        });
        try {
          const kpis = await api.mdInspection.getDashboardKPIs(year, weekNumber);
          set((state) => {
            state.dashboardKPIs = kpis;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[MDStore] fetchDashboardKPIs failed', error);
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      fetchWeeklyTrend: async (year, weekCount) => {
        try {
          const trend = await api.mdInspection.getWeeklyTrend(year, weekCount);
          set((state) => {
            state.weeklyTrend = trend;
          });
        } catch (error) {
          logger.error('[MDStore] fetchWeeklyTrend failed', error);
        }
      },

      setFilters: (filters) => {
        set((state) => {
          state.filters = filters;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    { name: 'MDInspectionStore' }
  )
);
