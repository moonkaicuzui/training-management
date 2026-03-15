/**
 * CAPA Store
 *
 * Zustand store for CAPA (Corrective and Preventive Action) management
 * Handles CRUD operations and workflow state transitions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Timestamp } from 'firebase/firestore';
import * as api from '@/services/api';
import { logger } from '@/utils/logger';
import i18n from '@/i18n';
import type {
  CAPA,
  CAPAInput,
  CAPAUpdate,
  CAPAStageUpdate,
  CAPAFilters,
  CAPADashboardStats,
  CAPAStatus,
} from '@/types/capa';

// ========== Store Interface ==========

interface CAPAState {
  // Data
  capas: CAPA[];
  currentCAPA: CAPA | null;
  dashboardStats: CAPADashboardStats | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  filters: CAPAFilters;

  // Actions
  fetchCAPAs: (filters?: CAPAFilters) => Promise<void>;
  fetchCAPAById: (id: string) => Promise<CAPA | null>;
  createCAPA: (input: CAPAInput) => Promise<string>;
  updateCAPA: (id: string, update: CAPAUpdate) => Promise<void>;
  updateCAPAStage: (id: string, stageUpdate: CAPAStageUpdate) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  setFilters: (filters: CAPAFilters) => void;
  clearError: () => void;
  setCurrentCAPA: (capa: CAPA | null) => void;
}

// ========== Helper Functions ==========

function calculateDashboardStats(capas: CAPA[]): CAPADashboardStats {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const byStatus: Record<CAPAStatus, number> = {
    discovery: 0,
    investigation: 0,
    action: 0,
    verification: 0,
    closed: 0,
    rejected: 0,
  };

  const bySeverity = { critical: 0, major: 0, minor: 0 };
  const byType = { corrective: 0, preventive: 0 };

  let overdue = 0;
  let closedThisMonth = 0;
  let totalResolutionDays = 0;
  let closedCount = 0;
  let effectiveCount = 0;
  let verifiedCount = 0;

  capas.forEach((capa) => {
    byStatus[capa.status]++;
    bySeverity[capa.severity]++;
    byType[capa.type]++;

    // Check overdue
    if (capa.dueDate && capa.status !== 'closed' && capa.status !== 'rejected') {
      const dueDate = capa.dueDate instanceof Date ? capa.dueDate : (capa.dueDate as Timestamp).toDate();
      if (dueDate < now) {
        overdue++;
      }
    }

    // Closed this month
    if (capa.status === 'closed' && capa.closure?.closedAt) {
      const closedAt = capa.closure.closedAt instanceof Date
        ? capa.closure.closedAt
        : (capa.closure.closedAt as Timestamp).toDate();
      if (closedAt.getMonth() === thisMonth && closedAt.getFullYear() === thisYear) {
        closedThisMonth++;
      }

      const createdAt = capa.createdAt instanceof Date
        ? capa.createdAt
        : (capa.createdAt as Timestamp).toDate();
      const days = Math.ceil((closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      totalResolutionDays += days;
      closedCount++;
    }

    // Effectiveness rate
    if (capa.verification) {
      verifiedCount++;
      if (capa.verification.isEffective) {
        effectiveCount++;
      }
    }
  });

  return {
    total: capas.length,
    byStatus,
    bySeverity,
    byType,
    overdue,
    closedThisMonth,
    averageResolutionDays: closedCount > 0 ? Math.round(totalResolutionDays / closedCount) : 0,
    effectivenessRate: verifiedCount > 0 ? Math.round((effectiveCount / verifiedCount) * 100) : 0,
  };
}

// ========== Store ==========

export const useCAPAStore = create<CAPAState>()(
  devtools(
    immer((set, get) => ({
      // Initial State
      capas: [],
      currentCAPA: null,
      dashboardStats: null,
      isLoading: false,
      error: null,
      filters: {},

      // Fetch all CAPAs with optional filters
      fetchCAPAs: async (filters?: CAPAFilters) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
          if (filters) {
            state.filters = filters;
          }
        });

        try {
          const currentFilters = filters || get().filters;
          const capas = await api.getCAPAs(currentFilters);

          set((state) => {
            state.capas = capas;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[CAPA Store] Failed to fetch CAPAs:', error);
          set((state) => {
            state.error = i18n.t('errors.capa.listFetchFailed');
            state.isLoading = false;
          });
        }
      },

      // Fetch single CAPA by ID
      fetchCAPAById: async (id: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const capa = await api.getCAPA(id);

          if (!capa) {
            set((state) => {
              state.error = i18n.t('errors.capa.notFound');
              state.isLoading = false;
            });
            return null;
          }

          set((state) => {
            state.currentCAPA = capa;
            state.isLoading = false;
          });

          return capa;
        } catch (error) {
          logger.error('[CAPA Store] Failed to fetch CAPA:', error);
          set((state) => {
            state.error = i18n.t('errors.capa.fetchFailed');
            state.isLoading = false;
          });
          return null;
        }
      },

      // Create new CAPA
      createCAPA: async (input: CAPAInput) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const id = await api.createCAPA(input);

          // Refresh list
          await get().fetchCAPAs();

          set((state) => {
            state.isLoading = false;
          });

          return id;
        } catch (error) {
          logger.error('[CAPA Store] Failed to create CAPA:', error);
          set((state) => {
            state.error = i18n.t('errors.capa.createFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      // Update CAPA basic info
      updateCAPA: async (id: string, update: CAPAUpdate) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await api.updateCAPA(id, update);

          // Refresh current CAPA if it's the one being edited
          if (get().currentCAPA?.id === id) {
            await get().fetchCAPAById(id);
          }

          // Refresh list
          await get().fetchCAPAs();

          set((state) => {
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[CAPA Store] Failed to update CAPA:', error);
          set((state) => {
            state.error = i18n.t('errors.capa.updateFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      // Update CAPA stage (workflow transition)
      updateCAPAStage: async (id: string, stageUpdate: CAPAStageUpdate) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await api.updateCAPAStage(id, stageUpdate);

          // Refresh current CAPA
          await get().fetchCAPAById(id);

          // Refresh list
          await get().fetchCAPAs();

          set((state) => {
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[CAPA Store] Failed to update CAPA stage:', error);
          set((state) => {
            state.error = i18n.t('errors.capa.stageUpdateFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      // Fetch dashboard statistics
      fetchDashboardStats: async () => {
        set((state) => {
          state.error = null;
        });
        try {
          const capas = await api.getAllCAPAs();
          const stats = calculateDashboardStats(capas);

          set((state) => {
            state.dashboardStats = stats;
          });
        } catch (error) {
          logger.error('[CAPA Store] Failed to fetch dashboard stats:', error);
          set((state) => {
            state.error = i18n.t('errors.capa.dashboardFetchFailed');
          });
        }
      },

      // Set filters
      setFilters: (filters: CAPAFilters) => {
        set((state) => {
          state.filters = filters;
        });
      },

      // Clear error
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // Set current CAPA
      setCurrentCAPA: (capa: CAPA | null) => {
        set((state) => {
          state.currentCAPA = capa;
        });
      },
    })),
    { name: 'CAPAStore' }
  )
);

// Selector hooks for common data access patterns
export const selectCAPAsByStatus = (status: CAPAStatus) => (state: CAPAState) =>
  state.capas.filter((c) => c.status === status);

export const selectOverdueCAPAs = (state: CAPAState) => {
  const now = new Date();
  return state.capas.filter((c) => {
    if (c.status === 'closed' || c.status === 'rejected') return false;
    if (!c.dueDate) return false;
    const dueDate = c.dueDate instanceof Date ? c.dueDate : (c.dueDate as Timestamp).toDate();
    return dueDate < now;
  });
};
