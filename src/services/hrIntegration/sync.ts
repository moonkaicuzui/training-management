/**
 * HR V2 직원 데이터 읽기, 변경 감지, Q-TRAIN 동기화
 */

import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, writeBatch } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { Employee } from '@/types';
import type { HREmployeeRecord, HRChangeEvent, HRSyncResult } from './types';
import { getHRFirestore, getPreviousMonth } from './firebase';

export async function fetchHREmployees(month: string, year: number): Promise<HREmployeeRecord[]> {
  try {
    const hrDb = await getHRFirestore();
    const monthYear = `${month}_${year}`;
    const docRef = doc(hrDb, 'hr_employees', monthYear, 'all_data', 'data');
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) { logger.info('[HRIntegration] HR V2 직원 데이터 없음:', monthYear); return []; }
    const data = snapshot.data();
    const employees = (data.employees as HREmployeeRecord[]) ?? [];
    logger.info(`[HRIntegration] HR V2 직원 ${employees.length}명 읽기 성공:`, monthYear);
    return employees;
  } catch (error) {
    logger.error('[HRIntegration] HR V2 직원 데이터 읽기 실패:', error);
    throw new Error('HR V2 시스템에 접근할 수 없습니다. 관리자에게 문의하세요.');
  }
}

export async function detectHRChanges(month: string, year: number): Promise<HRChangeEvent[]> {
  const events: HRChangeEvent[] = [];
  const currentEmployees = await fetchHREmployees(month, year);
  if (currentEmployees.length === 0) return events;

  for (const emp of currentEmployees) {
    if (emp.hired_this_month) {
      events.push({ type: 'NEW_HIRE', employeeId: emp.employee_id, employeeName: emp.employee_name, details: { hireDate: emp.entrance_date, team: emp.team, building: emp.building, position: emp.position } });
    }
  }
  for (const emp of currentEmployees) {
    if (emp.resigned_this_month) {
      events.push({ type: 'RESIGNATION', employeeId: emp.employee_id, employeeName: emp.employee_name, details: { resignDate: emp.resign_date ?? '', previousTeam: emp.team } });
    }
  }

  try {
    const prev = getPreviousMonth(month, year);
    const prevEmployees = await fetchHREmployees(prev.month, prev.year);
    if (prevEmployees.length > 0) {
      const prevMap = new Map<string, HREmployeeRecord>();
      for (const emp of prevEmployees) prevMap.set(emp.employee_id, emp);

      for (const emp of currentEmployees) {
        if (emp.hired_this_month || emp.resigned_this_month) continue;
        const prevEmp = prevMap.get(emp.employee_id);
        if (!prevEmp) continue;
        if (prevEmp.team && emp.team && prevEmp.team !== emp.team) {
          events.push({ type: 'DEPARTMENT_CHANGE', employeeId: emp.employee_id, employeeName: emp.employee_name, details: { from: prevEmp.team, to: emp.team } });
        }
        if (prevEmp.building && emp.building && prevEmp.building !== emp.building) {
          events.push({ type: 'BUILDING_CHANGE', employeeId: emp.employee_id, employeeName: emp.employee_name, details: { from: prevEmp.building, to: emp.building } });
        }
      }
    }
  } catch (error) {
    logger.warn('[HRIntegration] 이전 월 비교 실패 (무시):', error);
  }

  return events;
}

export async function syncEmployeesFromHR(month: string, year: number): Promise<HRSyncResult> {
  const result: HRSyncResult = { syncedAt: new Date().toISOString(), totalHREmployees: 0, newEmployees: [], resignedEmployees: [], departmentChanges: [], buildingChanges: [], updatedCount: 0, errors: [] };

  const hrEmployees = await fetchHREmployees(month, year);
  result.totalHREmployees = hrEmployees.length;
  if (hrEmployees.length === 0) return result;

  const events = await detectHRChanges(month, year);
  result.newEmployees = events.filter((e) => e.type === 'NEW_HIRE');
  result.resignedEmployees = events.filter((e) => e.type === 'RESIGNATION');
  result.departmentChanges = events.filter((e) => e.type === 'DEPARTMENT_CHANGE');
  result.buildingChanges = events.filter((e) => e.type === 'BUILDING_CHANGE');

  const existingSnapshot = await getDocs(query(collection(db, 'employees')));
  const existingMap = new Map<string, Employee>();
  existingSnapshot.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    existingMap.set(d.id, {
      employee_id: (data.employee_id as string) || d.id, employee_name: (data.employee_name as string) || '',
      department: data.department as Employee['department'], position: data.position as Employee['position'],
      building: data.building as Employee['building'], line: (data.line as string) || '',
      hire_date: (data.hire_date as string) || '', status: (data.status as Employee['status']) || 'ACTIVE', updated_at: '',
    });
  });

  const BATCH_SIZE = 500;
  const updates: Array<{ id: string; data: Record<string, unknown> }> = [];

  for (const hrEmp of hrEmployees) {
    const existing = existingMap.get(hrEmp.employee_id);
    if (!existing) {
      updates.push({ id: hrEmp.employee_id, data: { employee_id: hrEmp.employee_id, employee_name: hrEmp.employee_name, department: hrEmp.team || 'NEW', position: hrEmp.position || 'PRO_WORKER', building: hrEmp.building || 'BUILDING_A', line: '', hire_date: hrEmp.entrance_date || '', status: hrEmp.is_active ? 'ACTIVE' : 'INACTIVE', _sync_source: 'HR_V2', _sync_timestamp: serverTimestamp(), updated_at: serverTimestamp() } });
    } else {
      const needsUpdate: Record<string, unknown> = {};
      let changed = false;
      if ((hrEmp.resigned_this_month || !hrEmp.is_active) && existing.status !== 'INACTIVE') { needsUpdate.status = 'INACTIVE'; changed = true; }
      if (hrEmp.team && existing.department !== hrEmp.team) { needsUpdate.department = hrEmp.team; changed = true; }
      if (hrEmp.building && existing.building !== hrEmp.building) { needsUpdate.building = hrEmp.building; changed = true; }
      if (changed) updates.push({ id: hrEmp.employee_id, data: { ...needsUpdate, _sync_source: 'HR_V2', _sync_timestamp: serverTimestamp(), updated_at: serverTimestamp() } });
    }
  }

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const chunk = updates.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const update of chunk) {
      const docRef = doc(db, 'employees', update.id);
      const existing = existingMap.get(update.id);
      if (existing) batch.update(docRef, update.data);
      else batch.set(docRef, update.data);
    }
    try { await batch.commit(); result.updatedCount += chunk.length; }
    catch (error) { const msg = `배치 ${Math.floor(i / BATCH_SIZE) + 1} 쓰기 실패: ${error}`; logger.error('[HRIntegration]', msg); result.errors.push(msg); }
  }

  try {
    const syncLogRef = doc(db, 'hr_sync_logs', `${month}_${year}_${Date.now()}`);
    await setDoc(syncLogRef, { month, year, total_hr_employees: result.totalHREmployees, new_hires: result.newEmployees.length, resignations: result.resignedEmployees.length, department_changes: result.departmentChanges.length, building_changes: result.buildingChanges.length, updated_count: result.updatedCount, errors: result.errors, synced_at: serverTimestamp() });
  } catch (error) { logger.warn('[HRIntegration] 동기화 로그 저장 실패:', error); }

  logger.info(`[HRIntegration] 동기화 완료: 총 ${result.totalHREmployees}명, 신입 ${result.newEmployees.length}명, 퇴사 ${result.resignedEmployees.length}명, 부서이동 ${result.departmentChanges.length}명, 건물이동 ${result.buildingChanges.length}명`);
  return result;
}

export async function deactivateEmployee(employeeId: string): Promise<void> {
  try {
    const docRef = doc(db, 'employees', employeeId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error(`직원 ${employeeId}을 찾을 수 없습니다.`);
    await setDoc(docRef, { status: 'INACTIVE', _sync_source: 'HR_V2_DEACTIVATION', _sync_timestamp: serverTimestamp(), updated_at: serverTimestamp() }, { merge: true });
    logger.info(`[HRIntegration] 직원 ${employeeId} 비활성화 완료`);
  } catch (error) { logger.error(`[HRIntegration] 직원 ${employeeId} 비활성화 실패:`, error); throw error; }
}

export async function updateEmployeeDepartment(employeeId: string, updates: { department?: string; building?: string }): Promise<void> {
  try {
    const docRef = doc(db, 'employees', employeeId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error(`직원 ${employeeId}을 찾을 수 없습니다.`);
    await setDoc(docRef, { ...updates, _sync_source: 'HR_V2_UPDATE', _sync_timestamp: serverTimestamp(), updated_at: serverTimestamp() }, { merge: true });
    logger.info(`[HRIntegration] 직원 ${employeeId} 정보 업데이트 완료`);
  } catch (error) { logger.error(`[HRIntegration] 직원 ${employeeId} 정보 업데이트 실패:`, error); throw error; }
}
