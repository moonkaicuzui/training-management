/**
 * Metal Shoe Case Store
 *
 * Zustand store for Metal Shoe Case management
 * 금속 발견 신발 보고서 상태 관리
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import * as api from '@/services/api';
import { logger } from '@/utils/logger';
import i18n from '@/i18n';
import type {
  MetalShoeCase,
  MetalShoeActionTracking,
  MetalShoeDashboardKPI,
  MetalShoeFilters,
} from '@/types/metalShoe';

// ========== Store Interface ==========

interface MetalShoeState {
  // Data
  cases: MetalShoeCase[];
  actionTrackings: MetalShoeActionTracking[];
  dashboardKPIs: MetalShoeDashboardKPI | null;
  suppliers: Array<{ id: string; name: string; shortName: string; category: string }>;

  // UI State
  isLoading: boolean;
  error: string | null;
  filters: MetalShoeFilters;

  // Actions
  setFilters: (filters: Partial<MetalShoeFilters>) => void;
  fetchCases: (filters?: MetalShoeFilters) => Promise<void>;
  fetchDashboardKPIs: (year: number, weekNumber?: number) => Promise<void>;
  fetchActionTrackings: (year?: number) => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  createCase: (
    data: Omit<MetalShoeCase, 'id' | 'createdAt' | 'updatedAt'>,
    user: { uid: string; email: string; displayName: string }
  ) => Promise<MetalShoeCase>;
  updateCase: (year: number, id: string, data: Partial<MetalShoeCase>) => Promise<void>;
  createBulkCases: (
    cases: Array<Omit<MetalShoeCase, 'id' | 'createdAt' | 'updatedAt'>>,
    user: { uid: string; email: string; displayName: string }
  ) => Promise<number>;
  createActionTracking: (
    data: Omit<MetalShoeActionTracking, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  updateActionTracking: (id: string, data: Partial<MetalShoeActionTracking>) => Promise<void>;
  addActionEvidence: (year: number, caseId: string, evidence: { actionContent: string; evidencePhotos: string[]; submittedBy: string }) => Promise<void>;
  clearError: () => void;
}

// ========== Store Implementation ==========

const currentYear = new Date().getFullYear();

export const useMetalShoeStore = create<MetalShoeState>()(
  devtools(
    immer((set, get) => ({
      // Initial State
      cases: [],
      actionTrackings: [],
      dashboardKPIs: null,
      suppliers: [],
      isLoading: false,
      error: null,
      filters: { year: currentYear },

      // Actions
      setFilters: (newFilters) => {
        set((state) => {
          state.filters = { ...state.filters, ...newFilters };
        });
      },

      fetchCases: async (filters) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const f = filters || get().filters;
          const cases = await api.metalShoe.getCases(f);
          set((state) => {
            state.cases = cases;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[MetalShoeStore] fetchCases failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalShoe.fetchCasesFailed', 'Failed to load metal shoe cases');
            state.isLoading = false;
          });
        }
      },

      fetchDashboardKPIs: async (year, weekNumber) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const kpis = await api.metalShoe.getDashboardKPIs(year, weekNumber);
          set((state) => {
            state.dashboardKPIs = kpis;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[MetalShoeStore] fetchDashboardKPIs failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalShoe.fetchKPIsFailed', 'Failed to load KPIs');
            state.isLoading = false;
          });
        }
      },

      fetchActionTrackings: async (year) => {
        set((state) => {
          state.error = null;
        });
        try {
          const trackings = await api.metalShoe.getActionTrackings(year);
          set((state) => {
            state.actionTrackings = trackings;
          });
        } catch (error) {
          logger.error('[MetalShoeStore] fetchActionTrackings failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalShoe.fetchActionTrackingsFailed', 'Failed to load action trackings');
          });
        }
      },

      fetchSuppliers: async () => {
        try {
          const suppliers = await api.metalShoe.getSupplierList();
          set((state) => {
            state.suppliers = suppliers;
          });
        } catch (error) {
          logger.error('[MetalShoeStore] fetchSuppliers failed', error);
        }
      },

      createCase: async (data, user) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const newCase = await api.metalShoe.createCase(data, user);
          set((state) => {
            state.cases.unshift(newCase);
            state.isLoading = false;
          });
          return newCase;
        } catch (error) {
          logger.error('[MetalShoeStore] createCase failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalShoe.createCaseFailed', 'Failed to create case');
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateCase: async (year, id, data) => {
        set((state) => {
          state.error = null;
        });
        try {
          await api.metalShoe.updateCase(year, id, data);
          set((state) => {
            const idx = state.cases.findIndex((c) => c.id === id);
            if (idx !== -1) {
              Object.assign(state.cases[idx], data);
            }
          });
        } catch (error) {
          logger.error('[MetalShoeStore] updateCase failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalShoe.updateCaseFailed', 'Failed to update case');
          });
          throw error;
        }
      },

      createBulkCases: async (cases, user) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const count = await api.metalShoe.createBulkCases(cases, user);
          // Refresh cases after bulk import
          const f = get().filters;
          const refreshed = await api.metalShoe.getCases(f);
          set((state) => {
            state.cases = refreshed;
            state.isLoading = false;
          });
          return count;
        } catch (error) {
          logger.error('[MetalShoeStore] createBulkCases failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalShoe.bulkCreateFailed', 'Bulk import failed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      createActionTracking: async (data) => {
        try {
          const id = await api.metalShoe.createActionTracking(data);
          const trackings = await api.metalShoe.getActionTrackings(data.batchYear);
          set((state) => {
            state.actionTrackings = trackings;
          });
          return id;
        } catch (error) {
          logger.error('[MetalShoeStore] createActionTracking failed', error);
          throw error;
        }
      },

      updateActionTracking: async (id, data) => {
        try {
          await api.metalShoe.updateActionTracking(id, data);
          set((state) => {
            const idx = state.actionTrackings.findIndex((t) => t.id === id);
            if (idx !== -1) {
              Object.assign(state.actionTrackings[idx], data);
            }
          });
        } catch (error) {
          logger.error('[MetalShoeStore] updateActionTracking failed', error);
          throw error;
        }
      },

      addActionEvidence: async (year, caseId, evidence) => {
        set((state) => { state.error = null; });
        try {
          await api.metalShoe.addActionEvidence(year, caseId, evidence);
          // 케이스 목록 갱신
          const f = get().filters;
          const refreshed = await api.metalShoe.getCases(f);
          set((state) => { state.cases = refreshed; });
        } catch (error) {
          logger.error('[MetalShoeStore] addActionEvidence error:', error);
          throw error;
        }
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    { name: 'MetalShoeStore' }
  )
);
