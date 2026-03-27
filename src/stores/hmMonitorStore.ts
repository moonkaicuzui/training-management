/**
 * 온도-습도 모니터링 장치 Zustand Store
 *
 * devtools + immer 미들웨어
 * 서비스 직접 호출 (스토어는 서비스 직접 호출 허용)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import * as hmMonitorService from '@/services/hmMonitorService';
import { logger } from '@/utils/logger';
import i18n from '@/i18n';
import type {
  HMDevice,
  HMInspection,
  HMCheckResult,
  HMFilters,
  HMDashboardKPI,
  HMTrendItem,
  HMBuildingStats,
  HMRepeatedIssue,
} from '@/types/humidityMonitor';

// ========== Store Interface ==========

interface HMMonitorState {
  // Data
  devices: HMDevice[];
  inspections: HMInspection[];
  dashboardKPI: HMDashboardKPI | null;
  trend: HMTrendItem[];
  buildingComparison: HMBuildingStats[];
  repeatedIssues: HMRepeatedIssue[];

  // UI State
  isLoading: boolean;
  error: string | null;
  filters: HMFilters;

  // Device Actions
  fetchDevices: () => Promise<void>;
  createDevice: (data: Omit<HMDevice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<HMDevice>;
  updateDevice: (id: string, data: Partial<HMDevice>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  seedDevices: (devices: Omit<HMDevice, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<number>;

  // Inspection Actions
  fetchInspections: (filters?: HMFilters) => Promise<void>;
  createInspection: (
    inspectionDate: string,
    inspector: string,
    results: HMCheckResult[],
  ) => Promise<HMInspection>;
  updateInspection: (id: string, results: HMCheckResult[], inspector?: string) => Promise<void>;
  deleteInspection: (id: string) => Promise<void>;

  // Analytics Actions
  fetchDashboardKPI: (filters?: HMFilters) => Promise<void>;
  fetchTrend: (count?: number) => Promise<void>;
  fetchBuildingComparison: () => Promise<void>;
  fetchRepeatedIssues: (minConsecutive?: number) => Promise<void>;

  // UI Actions
  setFilters: (filters: HMFilters) => void;
  clearError: () => void;
}

// ========== Store Implementation ==========

export const useHMMonitorStore = create<HMMonitorState>()(
  devtools(
    immer((set) => ({
      // Initial State
      devices: [],
      inspections: [],
      dashboardKPI: null,
      trend: [],
      buildingComparison: [],
      repeatedIssues: [],
      isLoading: false,
      error: null,
      filters: {},

      // ── Device Actions ──────────────────────────────────

      fetchDevices: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const devices = await hmMonitorService.getDevices();
          set((state) => {
            state.devices = devices;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[HMMonitorStore] fetchDevices failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.fetchDevicesFailed');
            state.isLoading = false;
          });
        }
      },

      createDevice: async (data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const device = await hmMonitorService.createDevice(data);
          set((state) => {
            state.devices.push(device);
            state.devices.sort((a, b) => a.number - b.number);
            state.isLoading = false;
          });
          return device;
        } catch (error) {
          logger.error('[HMMonitorStore] createDevice failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.createDeviceFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateDevice: async (id, data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          await hmMonitorService.updateDevice(id, data);
          set((state) => {
            const idx = state.devices.findIndex((d) => d.id === id);
            if (idx !== -1) {
              Object.assign(state.devices[idx], data);
            }
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[HMMonitorStore] updateDevice failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.updateDeviceFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      deleteDevice: async (id) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          await hmMonitorService.deleteDevice(id);
          set((state) => {
            state.devices = state.devices.filter((d) => d.id !== id);
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[HMMonitorStore] deleteDevice failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.deleteDeviceFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      seedDevices: async (devices) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const count = await hmMonitorService.seedDevices(devices);
          // 시드 후 전체 목록 재조회
          const allDevices = await hmMonitorService.getDevices();
          set((state) => {
            state.devices = allDevices;
            state.isLoading = false;
          });
          return count;
        } catch (error) {
          logger.error('[HMMonitorStore] seedDevices failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.seedDevicesFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      // ── Inspection Actions ──────────────────────────────

      fetchInspections: async (filters) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const inspections = await hmMonitorService.getInspections(filters);
          set((state) => {
            state.inspections = inspections;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[HMMonitorStore] fetchInspections failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.fetchInspectionsFailed');
            state.isLoading = false;
          });
        }
      },

      createInspection: async (inspectionDate, inspector, results) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const inspection = await hmMonitorService.createInspection(inspectionDate, inspector, results);
          set((state) => {
            state.inspections.unshift(inspection);
            state.isLoading = false;
          });
          return inspection;
        } catch (error) {
          logger.error('[HMMonitorStore] createInspection failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.createInspectionFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateInspection: async (id, results, inspector) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          await hmMonitorService.updateInspection(id, results, inspector);
          set((state) => {
            const idx = state.inspections.findIndex((i) => i.id === id);
            if (idx !== -1) {
              state.inspections[idx].results = results;
              if (inspector) state.inspections[idx].inspector = inspector;
            }
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[HMMonitorStore] updateInspection failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.updateInspectionFailed');
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
          await hmMonitorService.deleteInspection(id);
          set((state) => {
            state.inspections = state.inspections.filter((i) => i.id !== id);
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[HMMonitorStore] deleteInspection failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.deleteInspectionFailed');
            state.isLoading = false;
          });
          throw error;
        }
      },

      // ── Analytics Actions ───────────────────────────────

      fetchDashboardKPI: async (filters) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const kpi = await hmMonitorService.getDashboardKPI(filters);
          set((state) => {
            state.dashboardKPI = kpi;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[HMMonitorStore] fetchDashboardKPI failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.fetchKPIFailed');
            state.isLoading = false;
          });
        }
      },

      fetchTrend: async (count) => {
        set((state) => {
          state.error = null;
        });
        try {
          const trend = await hmMonitorService.getTrend(count);
          set((state) => {
            state.trend = trend;
          });
        } catch (error) {
          logger.error('[HMMonitorStore] fetchTrend failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.fetchTrendFailed');
          });
        }
      },

      fetchBuildingComparison: async () => {
        set((state) => {
          state.error = null;
        });
        try {
          const comparison = await hmMonitorService.getBuildingComparison();
          set((state) => {
            state.buildingComparison = comparison;
          });
        } catch (error) {
          logger.error('[HMMonitorStore] fetchBuildingComparison failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.fetchBuildingComparisonFailed');
          });
        }
      },

      fetchRepeatedIssues: async (minConsecutive) => {
        set((state) => {
          state.error = null;
        });
        try {
          const issues = await hmMonitorService.getRepeatedIssues(minConsecutive);
          set((state) => {
            state.repeatedIssues = issues;
          });
        } catch (error) {
          logger.error('[HMMonitorStore] fetchRepeatedIssues failed', error);
          set((state) => {
            state.error = i18n.t('errors.humidityMonitor.fetchRepeatedIssuesFailed');
          });
        }
      },

      // ── UI Actions ──────────────────────────────────────

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
    { name: 'HMMonitorStore' },
  ),
);
