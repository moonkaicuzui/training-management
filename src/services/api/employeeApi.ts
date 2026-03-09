// ============================================================
// Q-TRAIN Employee API
// Employee CRUD operations
// ============================================================

import * as employeeService from '../employeeService';
import * as resultService from '../resultService';

import type {
  Employee,
  EmployeeFilters,
  TrainingResultRecord,
} from '@/types';

import { invalidateEmployeeCache } from './common';

// ========== Employee API ==========

export async function getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
  return employeeService.getEmployees(filters);
}

export async function getEmployee(id: string): Promise<Employee | null> {
  return employeeService.getEmployee(id);
}

export async function getEmployeeHistory(id: string): Promise<TrainingResultRecord[]> {
  return resultService.getResultsByEmployee(id);
}

export async function createEmployee(employee: Omit<Employee, 'updated_at'>): Promise<Employee> {
  const result = await employeeService.createEmployee(employee);
  invalidateEmployeeCache();
  return result;
}

export async function updateEmployee(
  id: string,
  updates: Partial<Employee>
): Promise<Employee | null> {
  await employeeService.updateEmployee(id, updates);
  invalidateEmployeeCache();
  return employeeService.getEmployee(id);
}

export async function batchUpsertEmployees(
  employees: Omit<Employee, 'updated_at'>[]
): Promise<number> {
  const result = await employeeService.batchUpsertEmployees(employees);
  invalidateEmployeeCache();
  return result;
}
