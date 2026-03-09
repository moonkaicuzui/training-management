// ============================================================
// Employee Slice - Normalized Store
// ============================================================

import { logger } from '@/utils/logger';
import type { StateCreator } from 'zustand';
import type {
  NormalizedEmployee,
  NormalizedEmployeeFilters,
} from '@/types/normalized';
import type { EmployeeId } from '@/types/branded';
import type { EmployeeFilters } from '@/types';
import type { NormalizedTrainingState } from './types';

import * as api from '@/services/api';
import { normalizeEmployees } from '@/types/normalized';

// ============================================================
// Slice State & Actions
// ============================================================

export interface EmployeeSliceState {
  // Entity data is stored in entities.employees (NormalizedEntities)
  // Filter data is stored in filters.employees (FilterState)
  // Loading data is stored in loading.entities.employees (LoadingState)
}

export interface EmployeeSliceActions {
  fetchEmployees: (filters?: NormalizedEmployeeFilters) => Promise<void>;
  getEmployee: (id: EmployeeId) => NormalizedEmployee | undefined;
  setSelectedEmployee: (id: EmployeeId | null) => void;
  addEmployee: (employee: NormalizedEmployee) => void;
  updateEmployee: (id: EmployeeId, updates: Partial<NormalizedEmployee>) => void;
  setEmployeeFilters: (filters: NormalizedEmployeeFilters) => void;
}

// ============================================================
// Slice Creator
// ============================================================

export const createEmployeeSlice: StateCreator<
  NormalizedTrainingState,
  [['zustand/devtools', never]],
  [],
  EmployeeSliceActions
> = (set, get) => ({
  fetchEmployees: async (filters) => {
    set((state) => ({
      error: null,
      loading: {
        ...state.loading,
        entities: { ...state.loading.entities, employees: true },
      },
    }));

    try {
      const legacyFilters: EmployeeFilters = filters ? {
        department: filters.department,
        position: filters.position,
        building: filters.building,
        line: filters.line,
        status: filters.status,
        search: filters.search,
      } : {};

      const rawEmployees = await api.getEmployees(legacyFilters);
      const employees = normalizeEmployees(rawEmployees);

      const employeeMap = new Map<EmployeeId, NormalizedEmployee>();
      employees.forEach(emp => employeeMap.set(emp.employee_id, emp));

      set((state) => ({
        entities: { ...state.entities, employees: employeeMap },
        filters: { ...state.filters, employees: filters || {} },
      }));
    } catch (error) {
      logger.error('Failed to fetch employees:', error);
      set({ error: 'Failed to fetch employees' });
      throw error;
    } finally {
      set((state) => ({
        loading: {
          ...state.loading,
          entities: { ...state.loading.entities, employees: false },
        },
      }));
    }
  },

  getEmployee: (id) => {
    return get().entities.employees.get(id);
  },

  setSelectedEmployee: (id) => {
    set((state) => ({
      ui: { ...state.ui, selectedEmployeeId: id },
    }));
  },

  addEmployee: (employee) => {
    set((state) => {
      const newEmployees = new Map(state.entities.employees);
      newEmployees.set(employee.employee_id, employee);
      return {
        entities: { ...state.entities, employees: newEmployees },
      };
    });
  },

  updateEmployee: (id, updates) => {
    set((state) => {
      const employee = state.entities.employees.get(id);
      if (!employee) return state;

      const updated = { ...employee, ...updates };
      const newEmployees = new Map(state.entities.employees);
      newEmployees.set(id, updated);

      return {
        entities: { ...state.entities, employees: newEmployees },
      };
    });
  },

  setEmployeeFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, employees: filters },
    }));
    get().fetchEmployees(filters);
  },
});
