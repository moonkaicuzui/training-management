import * as aqlService from '@/services/aqlService';
import * as api from '@/services/api';
import { processAqlRawData } from '@/utils/aqlDataProcessor';
import type { StoreSet, StoreGet } from './types';
import { isFresh, cache } from './cache';

export const createDataActions = (set: StoreSet, get: StoreGet) => ({
  fetchMonths: async () => {
    if (get().months.length > 0 && isFresh(cache.monthsAt)) return;

    set((state) => {
      state.isLoadingMonths = true;
      state.error = null;
    });

    try {
      const res = await aqlService.fetchAqlMonths();
      cache.monthsAt = Date.now();
      set((state) => {
        state.months = res.months;
        state.isLoadingMonths = false;
        if (!state.selectedMonth && res.months.length > 0) {
          state.selectedMonth = res.months[0].year_month;
        }
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Failed to fetch AQL months';
        state.isLoadingMonths = false;
      });
    }
  },

  fetchData: async (yearMonth?: string) => {
    const month = yearMonth || get().selectedMonth;
    if (!month) return;

    if (get().processedData && month === cache.dataMonth && isFresh(cache.dataAt)) {
      if (yearMonth) set((state) => { state.selectedMonth = yearMonth; });
      return;
    }

    set((state) => {
      state.isLoadingData = true;
      state.error = null;
      state.recommendations = [];
      if (yearMonth) {
        state.selectedMonth = yearMonth;
      }
    });

    try {
      const [res, employees] = await Promise.all([
        aqlService.fetchAqlMonthData(month),
        get().employees.length > 0
          ? Promise.resolve(get().employees)
          : api.getEmployees(),
      ]);

      const employeeMap = new Map<string, string>();
      for (const emp of employees) {
        employeeMap.set(emp.employee_id, emp.employee_name);
      }

      const processed = processAqlRawData(res.data, employeeMap);
      cache.dataAt = Date.now();
      cache.dataMonth = month;

      set((state) => {
        state.rawData = res.data;
        state.processedData = processed;
        state.isLoadingData = false;
        if (state.employees.length === 0) {
          state.employees = employees;
        }
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Failed to fetch AQL data';
        state.isLoadingData = false;
      });
    }
  },

  setSelectedMonth: (yearMonth: string) => {
    set((state) => {
      state.selectedMonth = yearMonth;
    });
  },
});
