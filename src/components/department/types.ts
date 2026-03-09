import type { Employee } from '@/types';

export interface EmployeeStats {
  employee: Employee;
  completedCount: number;
  passRate: number;
  totalResults: number;
  passResults: number;
}

export interface KPIData {
  totalEmployees: number;
  completionRate: number;
  passRate: number;
  expiringCerts: number;
  retrainingNeeded: number;
}

export interface CompletionByProgramItem {
  name: string;
  completionRate: number;
}

export interface PassRateTrendItem {
  name: string;
  passRate: number;
  total: number;
}

export function getPassRateColor(rate: number): string {
  if (rate >= 80) return 'text-emerald-600';
  if (rate >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export function getPassRateBadge(rate: number): 'default' | 'secondary' | 'destructive' {
  if (rate >= 80) return 'default';
  if (rate >= 60) return 'secondary';
  return 'destructive';
}
