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
import i18n from '@/i18n';
import type {
  MDInspection,
  MDFailure,
  MDFilters,
  MDDashboardKPI,
  MDWeeklyTrend,
  MDWeeklyComparison,
  MDRepeatedIssueSummary,
  MDEmailRecipient,
} from '@/types/metalDetector';

// ========== Store Interface ==========

interface MDInspectionState {
  // Data
  inspections: MDInspection[];
  failures: MDFailure[];
  dashboardKPIs: MDDashboardKPI | null;
  weeklyTrend: MDWeeklyTrend[];
  weeklyComparison: MDWeeklyComparison | null;
  repeatedIssues: MDRepeatedIssueSummary | null;
  emailRecipients: MDEmailRecipient[];

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
  deleteInspection: (id: string) => Promise<void>;
  fetchFailures: (inspectionId?: string) => Promise<void>;
  createFailure: (
    data: Omit<MDFailure, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<MDFailure>;
  createInspectionWithFailure: (
    inspectionData: Omit<MDInspection, 'id' | 'weekNumber' | 'year' | 'createdAt' | 'updatedAt'>,
    failureData?: Omit<MDFailure, 'id' | 'inspectionId' | 'createdAt' | 'updatedAt'>,
  ) => Promise<{ inspection: MDInspection; failure?: MDFailure }>;
  updateFailureCA: (
    id: string,
    data: Partial<Omit<MDFailure, 'id' | 'createdAt'>>
  ) => Promise<void>;
  fetchDashboardKPIs: (year: number, weekNumber?: number) => Promise<void>;
  fetchWeeklyTrend: (year: number, weekCount?: number) => Promise<void>;
  fetchWeeklyComparison: (year: number, weekNumber: number) => Promise<void>;
  fetchRepeatedIssues: (year: number, weekNumber: number) => Promise<void>;
  fetchEmailRecipients: () => Promise<void>;
  addEmailRecipient: (
    data: Omit<MDEmailRecipient, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateEmailRecipient: (
    id: string,
    data: Partial<Omit<MDEmailRecipient, 'id' | 'createdAt'>>
  ) => Promise<void>;
  removeEmailRecipient: (id: string) => Promise<void>;
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
      weeklyComparison: null,
      repeatedIssues: null,
      emailRecipients: [],
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
            state.error = i18n.t('errors.metalDetector.fetchInspectionsFailed');
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
            state.error = i18n.t('errors.metalDetector.createInspectionFailed');
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
            state.error = i18n.t('errors.metalDetector.updateInspectionFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      deleteInspection: async (id) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          await api.mdInspection.deleteInspection(id);
          set((state) => {
            state.inspections = state.inspections.filter((i) => i.id !== id);
            state.failures = state.failures.filter((f) => f.inspectionId !== id);
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[MDStore] deleteInspection failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalDetector.deleteInspectionFailed', 'Failed to delete inspection');
            state.isLoading = false;
          });
          throw error;
        }
      },

      fetchFailures: async (inspectionId) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const failures = await api.mdInspection.getFailures(inspectionId);
          set((state) => {
            state.failures = failures;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[MDStore] fetchFailures failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalDetector.fetchFailuresFailed');
            state.isLoading = false;
          });
        }
      },

      createFailure: async (data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const failure = await api.mdInspection.createFailure(data);
          set((state) => {
            state.failures.unshift(failure);
            state.isLoading = false;
          });
          return failure;
        } catch (error) {
          logger.error('[MDStore] createFailure failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalDetector.createFailureFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      createInspectionWithFailure: async (inspectionData, failureData) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const result = await api.mdInspection.createInspectionWithFailure(inspectionData, failureData);
          set((state) => {
            state.inspections.unshift(result.inspection);
            if (result.failure) {
              state.failures.unshift(result.failure);
            }
            state.isLoading = false;
          });
          return result;
        } catch (error) {
          logger.error('[MDStore] createInspectionWithFailure failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalDetector.createInspectionFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateFailureCA: async (id, data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          await api.mdInspection.updateFailure(id, data);
          set((state) => {
            const idx = state.failures.findIndex((f) => f.id === id);
            if (idx !== -1) {
              Object.assign(state.failures[idx], data);
            }
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[MDStore] updateFailureCA failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalDetector.updateCorrectiveActionFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      fetchDashboardKPIs: async (year, weekNumber) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
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
            state.error = i18n.t('errors.metalDetector.fetchKPIsFailed');
            state.isLoading = false;
          });
        }
      },

      fetchWeeklyTrend: async (year, weekCount) => {
        set((state) => {
          state.error = null;
        });
        try {
          const trend = await api.mdInspection.getWeeklyTrend(year, weekCount);
          set((state) => {
            state.weeklyTrend = trend;
          });
        } catch (error) {
          logger.error('[MDStore] fetchWeeklyTrend failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalDetector.fetchWeeklyTrendFailed');
          });
        }
      },

      fetchWeeklyComparison: async (year, weekNumber) => {
        set((state) => {
          state.error = null;
        });
        try {
          const comparison = await api.mdInspection.getWeeklyComparison(year, weekNumber);
          set((state) => {
            state.weeklyComparison = comparison;
          });
        } catch (error) {
          logger.error('[MDStore] fetchWeeklyComparison failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalDetector.fetchWeeklyComparisonFailed');
          });
        }
      },

      fetchRepeatedIssues: async (year, weekNumber) => {
        set((state) => {
          state.error = null;
        });
        try {
          const issues = await api.mdInspection.getRepeatedIssues(year, weekNumber);
          set((state) => {
            state.repeatedIssues = issues;
          });
        } catch (error) {
          logger.error('[MDStore] fetchRepeatedIssues failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalDetector.fetchRepeatedIssuesFailed');
          });
        }
      },

      fetchEmailRecipients: async () => {
        set((state) => {
          state.error = null;
        });
        try {
          const recipients = await api.mdInspection.getEmailRecipients();
          set((state) => {
            state.emailRecipients = recipients;
          });
        } catch (error) {
          logger.error('[MDStore] fetchEmailRecipients failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalDetector.fetchEmailRecipientsFailed');
          });
        }
      },

      addEmailRecipient: async (data) => {
        set((state) => {
          state.error = null;
        });
        try {
          const recipient = await api.mdInspection.addEmailRecipient(data);
          set((state) => {
            state.emailRecipients.push(recipient);
          });
        } catch (error) {
          logger.error('[MDStore] addEmailRecipient failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalDetector.addEmailRecipientFailed');
          });
          throw error;
        }
      },

      updateEmailRecipient: async (id, data) => {
        set((state) => {
          state.error = null;
        });
        try {
          await api.mdInspection.updateEmailRecipient(id, data);
          set((state) => {
            const idx = state.emailRecipients.findIndex((r) => r.id === id);
            if (idx !== -1) {
              Object.assign(state.emailRecipients[idx], data);
            }
          });
        } catch (error) {
          logger.error('[MDStore] updateEmailRecipient failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalDetector.updateEmailRecipientFailed');
          });
          throw error;
        }
      },

      removeEmailRecipient: async (id) => {
        set((state) => {
          state.error = null;
        });
        try {
          await api.mdInspection.removeEmailRecipient(id);
          set((state) => {
            state.emailRecipients = state.emailRecipients.filter((r) => r.id !== id);
          });
        } catch (error) {
          logger.error('[MDStore] removeEmailRecipient failed', error);
          set((state) => {
            state.error = i18n.t('errors.metalDetector.removeEmailRecipientFailed');
          });
          throw error;
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
