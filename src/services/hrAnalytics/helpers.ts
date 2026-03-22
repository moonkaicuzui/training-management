import {
  db,
  collection,
  query,
  getDocs,
  limit,
  where,
} from '@/services/firebase';
import {
  fetchHREmployees,
  type HREmployeeRecord,
} from '@/services/hrIntegrationService';
import { logger } from '@/utils/logger';

export const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

export function getPreviousMonth(month: string, year: number): { month: string; year: number } {
  const idx = MONTH_NAMES.indexOf(month);
  if (idx <= 0) return { month: MONTH_NAMES[11], year: year - 1 };
  return { month: MONTH_NAMES[idx - 1], year };
}

export function getNextMonth(month: string, year: number): { month: string; year: number } {
  const idx = MONTH_NAMES.indexOf(month);
  if (idx >= 11) return { month: MONTH_NAMES[0], year: year + 1 };
  return { month: MONTH_NAMES[idx + 1], year };
}

export function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export async function safelyFetchHREmployees(month: string, year: number): Promise<HREmployeeRecord[]> {
  try {
    return await fetchHREmployees(month, year);
  } catch (error) {
    logger.warn('[hrAnalytics] HR V2 직원 데이터 접근 실패 (Q-TRAIN 데이터만 사용):', error);
    return [];
  }
}

export async function fetchQTrainEmployees(): Promise<Map<string, {
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
  building: string;
  hire_date: string;
  status: string;
}>> {
  const snapshot = await getDocs(query(collection(db, 'employees'), limit(5000)));
  const map = new Map<string, {
    employee_id: string;
    employee_name: string;
    department: string;
    position: string;
    building: string;
    hire_date: string;
    status: string;
  }>();
  snapshot.docs.forEach((d) => {
    const data = d.data();
    map.set(d.id, {
      employee_id: (data.employee_id as string) || d.id,
      employee_name: (data.employee_name as string) || '',
      department: (data.department as string) || '',
      position: (data.position as string) || '',
      building: (data.building as string) || '',
      hire_date: (data.hire_date as string) || '',
      status: (data.status as string) || 'ACTIVE',
    });
  });
  return map;
}

export async function fetchTrainingResults(filters?: {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Array<{
  employee_id: string;
  program_code: string;
  training_date: string;
  score: number | null;
  result: string;
  grade: string | null;
}>> {
  const constraints = [];
  if (filters?.employeeId) {
    constraints.push(where('employee_id', '==', filters.employeeId));
  }
  constraints.push(limit(2000));
  const q = query(collection(db, 'training_results'), ...constraints);
  const snapshot = await getDocs(q);
  let results = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      employee_id: (data.employee_id as string) || '',
      program_code: (data.program_code as string) || '',
      training_date: (data.training_date as string) || '',
      score: (data.score as number | null) ?? null,
      result: (data.result as string) || 'ABSENT',
      grade: (data.grade as string | null) ?? null,
    };
  });
  if (filters?.startDate) {
    results = results.filter((r) => r.training_date >= filters.startDate!);
  }
  if (filters?.endDate) {
    results = results.filter((r) => r.training_date <= filters.endDate!);
  }
  return results;
}

export async function fetchPrograms(): Promise<Map<string, {
  program_code: string;
  program_name: string;
  category: string;
  duration_hours: number;
  target_positions: string[];
}>> {
  const snapshot = await getDocs(query(collection(db, 'training_programs'), limit(500)));
  const map = new Map();
  snapshot.docs.forEach((d) => {
    const data = d.data();
    map.set((data.program_code as string) || d.id, {
      program_code: (data.program_code as string) || d.id,
      program_name: (data.program_name as string) || '',
      category: (data.category as string) || '',
      duration_hours: (data.duration_hours as number) || 0,
      target_positions: (data.target_positions as string[]) || [],
    });
  });
  return map;
}
