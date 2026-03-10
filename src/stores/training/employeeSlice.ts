import type { EmployeeFilters, Employee } from '@/types';
import * as api from '@/services/api';
import { logger } from '@/utils/logger';
import i18n from '@/i18n';
import type { StoreSet, StoreGet } from './types';

export const createEmployeeActions = (set: StoreSet, get: StoreGet) => ({
  fetchEmployees: async (filters?: EmployeeFilters) => {
    set((state) => ({ loading: { ...state.loading, employees: true }, error: null }));
    try {
      const mergedFilters = { ...get().employeeFilters, ...filters };
      const employees = await api.getEmployees(mergedFilters);
      set({ employees, employeeFilters: mergedFilters });
    } catch (error) {
      set({ error: i18n.t('errors.training.fetchEmployeesFailed') });
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, employees: false } }));
    }
  },

  fetchEmployee: async (id: string) => {
    set({ error: null });
    try {
      const employee = await api.getEmployee(id);
      set({ selectedEmployee: employee });
    } catch (error) {
      logger.error('Failed to fetch employee:', error);
      set({ error: i18n.t('errors.training.fetchEmployeeFailed') });
      throw error;
    }
  },

  fetchEmployeeHistory: async (id: string) => {
    set({ error: null });
    try {
      const history = await api.getEmployeeHistory(id);
      set({ employeeHistory: history });
    } catch (error) {
      logger.error('Failed to fetch employee history:', error);
      set({ error: i18n.t('errors.training.fetchEmployeeHistoryFailed') });
      throw error;
    }
  },

  setEmployeeFilters: (filters: EmployeeFilters) => {
    set({ employeeFilters: filters });
    get().fetchEmployees(filters);
  },

  createEmployee: async (employee: Omit<Employee, 'updated_at'>) => {
    set({ error: null });
    try {
      const newEmployee = await api.createEmployee(employee);
      set((state) => ({ employees: [...state.employees, newEmployee] }));
      return newEmployee;
    } catch (error) {
      logger.error('Failed to create employee:', error);
      set({ error: i18n.t('errors.training.createEmployeeFailed') });
      throw error;
    }
  },

  updateEmployee: async (id: string, updates: Partial<Employee>) => {
    set({ error: null });
    try {
      const updated = await api.updateEmployee(id, updates);
      if (updated) {
        set((state) => ({
          employees: state.employees.map((e) =>
            e.employee_id === id ? updated : e
          ),
          selectedEmployee:
            state.selectedEmployee?.employee_id === id
              ? updated
              : state.selectedEmployee,
        }));
      }
    } catch (error) {
      logger.error('Failed to update employee:', error);
      set({ error: i18n.t('errors.training.updateEmployeeFailed') });
      throw error;
    }
  },
});
