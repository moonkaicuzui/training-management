import * as api from '@/services/api';
import { fetchActiveType3Employees } from '@/services/aqlService';
import type { StoreSet, StoreGet } from './types';

export const createDashboardActions = (set: StoreSet, get: StoreGet) => ({
  fetchDashboardStats: async () => {
    set(state => ({
      loading: { ...state.loading, dashboard: true },
      error: null,
    }));

    try {
      const dashboardStats = await api.getNewTQCDashboardStats();
      set({ dashboardStats, loading: { ...get().loading, dashboard: false } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch dashboard stats';
      set({
        error: message,
        loading: { ...get().loading, dashboard: false },
      });
    }
  },

  fetchHrType3Employees: async () => {
    set(state => ({
      loading: { ...state.loading, hrEmployees: true },
      error: null,
    }));

    try {
      const employees = await fetchActiveType3Employees();
      set({ hrType3Employees: employees, loading: { ...get().loading, hrEmployees: false } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch HR TYPE-3 employees';
      set({
        error: message,
        loading: { ...get().loading, hrEmployees: false },
      });
    }
  },
});
