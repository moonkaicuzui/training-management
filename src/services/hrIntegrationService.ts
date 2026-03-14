/**
 * HR V2 Cross-Project Integration Service
 *
 * HR Dashboard (hr-dashboard-7521b) 프로젝트의 Firestore에서
 * 인사 요약 데이터를 읽어와 Q-TRAIN 대시보드에 표시.
 *
 * 전략:
 * 1. HR V2 Firestore 직접 읽기 시도 (크로스 프로젝트)
 * 2. 실패 시 Q-TRAIN 내부 hr_sync_summary 컬렉션에서 읽기 (폴백)
 * 3. 관리자가 수동 동기화 가능 (HR V2 → Q-TRAIN 복사)
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { Employee } from '@/types';

// ============================================================
// HR V2 Firebase 설정 (별도 프로젝트)
// ============================================================

const HR_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_HR_API_KEY || '',
  authDomain: 'hr-dashboard-7521b.firebaseapp.com',
  projectId: 'hr-dashboard-7521b',
  storageBucket: 'hr-dashboard-7521b.firebasestorage.app',
  messagingSenderId: '1056281205538',
  appId: '1:1056281205538:web:bb6f3539182dccddbd637b',
};

const HR_APP_NAME = 'hr-v2';

// ============================================================
// 타입 정의
// ============================================================

/** HR V2 직원 레코드 (hr_employees 컬렉션의 employees 배열 항목) */
export interface HREmployeeRecord {
  employee_id: string;
  employee_name: string;
  team: string;
  position: string;
  position_3rd: string;
  building: string;
  entrance_date: string;
  resign_date: string | null;
  is_active: boolean;
  hired_this_month: boolean;
  resigned_this_month: boolean;
  working_days: number;
  absent_days: number;
  unauthorized_absent_days: number;
  risk_score: number;
  risk_level: string;
}

/** HR 변경 이벤트 타입 */
export type HRChangeType = 'NEW_HIRE' | 'RESIGNATION' | 'DEPARTMENT_CHANGE' | 'BUILDING_CHANGE';

/** HR 변경 이벤트 */
export interface HRChangeEvent {
  type: HRChangeType;
  employeeId: string;
  employeeName: string;
  details: {
    hireDate?: string;
    team?: string;
    building?: string;
    position?: string;
    resignDate?: string;
    previousTeam?: string;
    from?: string;
    to?: string;
  };
}

/** HR 동기화 결과 */
export interface HRSyncResult {
  syncedAt: string;
  totalHREmployees: number;
  newEmployees: HRChangeEvent[];
  resignedEmployees: HRChangeEvent[];
  departmentChanges: HRChangeEvent[];
  buildingChanges: HRChangeEvent[];
  updatedCount: number;
  errors: string[];
}

export interface HRSummary {
  totalHeadcount: number;
  activeHeadcount: number;
  newHires: number;
  resignations: number;
  attendanceRate: number;
  absenceRate: number;
  unauthorizedAbsenceRate: number;
  turnoverRate: number;
  aqlPassRate: number;
  fivePrsPassRate: number;
  avgTenure: number;
  monthYear: string; // e.g. "march_2026"
  syncedAt?: string; // ISO date string (Q-TRAIN 내부 동기화 시간)
}

// ============================================================
// HR V2 Firebase 앱 초기화 (Singleton)
// ============================================================

function getHRApp() {
  const existing = getApps().find((app) => app.name === HR_APP_NAME);
  if (existing) return existing;
  return initializeApp(HR_FIREBASE_CONFIG, HR_APP_NAME);
}

function getHRFirestore() {
  return getFirestore(getHRApp());
}

// ============================================================
// 월 이름 유틸
// ============================================================

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function getCurrentMonthYear(): { month: string; year: number } {
  const now = new Date();
  return {
    month: MONTH_NAMES[now.getMonth()],
    year: now.getFullYear(),
  };
}

// ============================================================
// Firestore 데이터 → HRSummary 변환
// ============================================================

function mapFirestoreToHRSummary(
  data: Record<string, unknown>,
  docId: string,
): HRSummary {
  return {
    totalHeadcount: (data.total_headcount as number) ?? 0,
    activeHeadcount: (data.active_headcount as number) ?? 0,
    newHires: (data.new_hires as number) ?? 0,
    resignations: (data.resignations as number) ?? 0,
    attendanceRate: (data.attendance_rate as number) ?? 0,
    absenceRate: (data.absence_rate as number) ?? 0,
    unauthorizedAbsenceRate: (data.unauthorized_absence_rate as number) ?? 0,
    turnoverRate: (data.turnover_rate as number) ?? 0,
    aqlPassRate: (data.aql_pass_rate as number) ?? 0,
    fivePrsPassRate: (data.five_prs_pass_rate as number) ?? 0,
    avgTenure: (data.avg_tenure as number) ?? 0,
    monthYear: docId,
    syncedAt: (data.synced_at as string) ?? undefined,
  };
}

// ============================================================
// 1. HR V2 Firestore 직접 읽기 (크로스 프로젝트)
// ============================================================

async function fetchFromHRV2(
  month: string,
  year: number,
): Promise<HRSummary | null> {
  try {
    const hrDb = getHRFirestore();
    const docId = `${month}_${year}`;
    const docRef = doc(hrDb, 'hr_dashboard_summary', docId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      logger.info('[HRIntegration] HR V2에 해당 월 데이터 없음:', docId);
      return null;
    }

    const data = snapshot.data();
    logger.info('[HRIntegration] HR V2 직접 읽기 성공:', docId);
    return mapFirestoreToHRSummary(data, docId);
  } catch (error) {
    logger.warn('[HRIntegration] HR V2 직접 읽기 실패 (폴백 시도):', error);
    return null;
  }
}

// ============================================================
// 2. Q-TRAIN 내부 동기화 컬렉션에서 읽기 (폴백)
// ============================================================

async function fetchFromLocalSync(
  month: string,
  year: number,
): Promise<HRSummary | null> {
  try {
    const docId = `${month}_${year}`;
    const docRef = doc(db, 'hr_sync_summary', docId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      logger.info('[HRIntegration] 로컬 동기화 데이터 없음:', docId);
      return null;
    }

    const data = snapshot.data();
    logger.info('[HRIntegration] 로컬 동기화 데이터 읽기 성공:', docId);
    return mapFirestoreToHRSummary(data, docId);
  } catch (error) {
    logger.error('[HRIntegration] 로컬 동기화 읽기 실패:', error);
    return null;
  }
}

// ============================================================
// 3. HR V2 → Q-TRAIN 동기화 (관리자 수동 트리거)
// ============================================================

export async function syncHRSummaryToLocal(
  month: string,
  year: number,
): Promise<HRSummary | null> {
  const hrData = await fetchFromHRV2(month, year);
  if (!hrData) {
    logger.warn('[HRIntegration] HR V2에서 동기화할 데이터 없음');
    return null;
  }

  try {
    const docId = `${month}_${year}`;
    const docRef = doc(db, 'hr_sync_summary', docId);
    await setDoc(docRef, {
      total_headcount: hrData.totalHeadcount,
      active_headcount: hrData.activeHeadcount,
      new_hires: hrData.newHires,
      resignations: hrData.resignations,
      attendance_rate: hrData.attendanceRate,
      absence_rate: hrData.absenceRate,
      unauthorized_absence_rate: hrData.unauthorizedAbsenceRate,
      turnover_rate: hrData.turnoverRate,
      aql_pass_rate: hrData.aqlPassRate,
      five_prs_pass_rate: hrData.fivePrsPassRate,
      avg_tenure: hrData.avgTenure,
      synced_at: new Date().toISOString(),
      updated_at: serverTimestamp(),
    });

    logger.info('[HRIntegration] Q-TRAIN에 HR 요약 동기화 완료:', docId);
    return { ...hrData, syncedAt: new Date().toISOString() };
  } catch (error) {
    logger.error('[HRIntegration] Q-TRAIN 동기화 저장 실패:', error);
    return null;
  }
}

// ============================================================
// 공개 API: HR 요약 가져오기 (자동 폴백)
// ============================================================

/**
 * 지정된 월의 HR 요약 데이터를 가져옵니다.
 * 1. HR V2 직접 읽기 시도
 * 2. 실패 시 Q-TRAIN 내부 동기화 컬렉션에서 읽기
 *
 * @param month - 영어 월명 소문자 (january, february, ..., december)
 * @param year - 연도 (예: 2026)
 */
export async function getHRSummary(
  month: string,
  year: number,
): Promise<HRSummary | null> {
  // 1차: HR V2 직접 읽기
  const hrData = await fetchFromHRV2(month, year);
  if (hrData) return hrData;

  // 2차: Q-TRAIN 로컬 동기화 데이터
  return fetchFromLocalSync(month, year);
}

/**
 * 현재 월의 HR 요약 데이터를 가져옵니다.
 */
export async function getCurrentHRSummary(): Promise<HRSummary | null> {
  const { month, year } = getCurrentMonthYear();
  return getHRSummary(month, year);
}

/**
 * 현재 월의 HR 데이터를 동기화합니다 (관리자용).
 */
export async function syncCurrentHRSummary(): Promise<HRSummary | null> {
  const { month, year } = getCurrentMonthYear();
  return syncHRSummaryToLocal(month, year);
}

// ============================================================
// HR V2 직원 데이터 읽기
// ============================================================

/**
 * HR V2 Firestore에서 특정 월의 직원 데이터를 읽습니다.
 * 경로: hr_employees/{month_year}/all_data/data → { employees: [...] }
 */
export async function fetchHREmployees(
  month: string,
  year: number,
): Promise<HREmployeeRecord[]> {
  try {
    const hrDb = getHRFirestore();
    const monthYear = `${month}_${year}`;
    const docRef = doc(hrDb, 'hr_employees', monthYear, 'all_data', 'data');
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      logger.info('[HRIntegration] HR V2 직원 데이터 없음:', monthYear);
      return [];
    }

    const data = snapshot.data();
    const employees = (data.employees as HREmployeeRecord[]) ?? [];
    logger.info(`[HRIntegration] HR V2 직원 ${employees.length}명 읽기 성공:`, monthYear);
    return employees;
  } catch (error) {
    logger.error('[HRIntegration] HR V2 직원 데이터 읽기 실패:', error);
    throw new Error(
      'HR V2 시스템에 접근할 수 없습니다. 관리자에게 문의하세요.'
    );
  }
}

// ============================================================
// 이전 월 월명 계산 유틸
// ============================================================

function getPreviousMonth(month: string, year: number): { month: string; year: number } {
  const idx = MONTH_NAMES.indexOf(month);
  if (idx <= 0) {
    return { month: MONTH_NAMES[11], year: year - 1 };
  }
  return { month: MONTH_NAMES[idx - 1], year };
}

// ============================================================
// HR 변경 이벤트 감지
// ============================================================

/**
 * HR V2 데이터에서 변경 이벤트를 감지합니다.
 * - hired_this_month / resigned_this_month 플래그 사용
 * - 이전월 대비 team/building 변경 감지
 */
export async function detectHRChanges(
  month: string,
  year: number,
): Promise<HRChangeEvent[]> {
  const events: HRChangeEvent[] = [];

  // 현재 월 데이터
  const currentEmployees = await fetchHREmployees(month, year);
  if (currentEmployees.length === 0) {
    return events;
  }

  // 신입 감지 (hired_this_month 플래그)
  for (const emp of currentEmployees) {
    if (emp.hired_this_month) {
      events.push({
        type: 'NEW_HIRE',
        employeeId: emp.employee_id,
        employeeName: emp.employee_name,
        details: {
          hireDate: emp.entrance_date,
          team: emp.team,
          building: emp.building,
          position: emp.position,
        },
      });
    }
  }

  // 퇴사 감지 (resigned_this_month 플래그)
  for (const emp of currentEmployees) {
    if (emp.resigned_this_month) {
      events.push({
        type: 'RESIGNATION',
        employeeId: emp.employee_id,
        employeeName: emp.employee_name,
        details: {
          resignDate: emp.resign_date ?? '',
          previousTeam: emp.team,
        },
      });
    }
  }

  // 부서/건물 변경 감지: 이전 월 데이터와 비교
  try {
    const prev = getPreviousMonth(month, year);
    const prevEmployees = await fetchHREmployees(prev.month, prev.year);

    if (prevEmployees.length > 0) {
      const prevMap = new Map<string, HREmployeeRecord>();
      for (const emp of prevEmployees) {
        prevMap.set(emp.employee_id, emp);
      }

      for (const emp of currentEmployees) {
        // 이번 달 신입/퇴사는 이미 처리됨
        if (emp.hired_this_month || emp.resigned_this_month) continue;

        const prevEmp = prevMap.get(emp.employee_id);
        if (!prevEmp) continue;

        // 부서(team) 변경
        if (prevEmp.team && emp.team && prevEmp.team !== emp.team) {
          events.push({
            type: 'DEPARTMENT_CHANGE',
            employeeId: emp.employee_id,
            employeeName: emp.employee_name,
            details: {
              from: prevEmp.team,
              to: emp.team,
            },
          });
        }

        // 건물(building) 변경
        if (prevEmp.building && emp.building && prevEmp.building !== emp.building) {
          events.push({
            type: 'BUILDING_CHANGE',
            employeeId: emp.employee_id,
            employeeName: emp.employee_name,
            details: {
              from: prevEmp.building,
              to: emp.building,
            },
          });
        }
      }
    }
  } catch (error) {
    logger.warn('[HRIntegration] 이전 월 비교 실패 (무시):', error);
  }

  return events;
}

// ============================================================
// Q-TRAIN 직원 동기화
// ============================================================

/**
 * HR V2 직원 데이터를 Q-TRAIN employees 컬렉션과 동기화합니다.
 * - 신규 직원 자동 추가
 * - 퇴사자 status → INACTIVE
 * - 부서/건물 변경 반영
 */
export async function syncEmployeesFromHR(
  month: string,
  year: number,
): Promise<HRSyncResult> {
  const result: HRSyncResult = {
    syncedAt: new Date().toISOString(),
    totalHREmployees: 0,
    newEmployees: [],
    resignedEmployees: [],
    departmentChanges: [],
    buildingChanges: [],
    updatedCount: 0,
    errors: [],
  };

  // 1. HR V2에서 직원 데이터 읽기
  const hrEmployees = await fetchHREmployees(month, year);
  result.totalHREmployees = hrEmployees.length;

  if (hrEmployees.length === 0) {
    return result;
  }

  // 2. 변경 이벤트 감지
  const events = await detectHRChanges(month, year);
  result.newEmployees = events.filter((e) => e.type === 'NEW_HIRE');
  result.resignedEmployees = events.filter((e) => e.type === 'RESIGNATION');
  result.departmentChanges = events.filter((e) => e.type === 'DEPARTMENT_CHANGE');
  result.buildingChanges = events.filter((e) => e.type === 'BUILDING_CHANGE');

  // 3. Q-TRAIN employees 컬렉션 조회
  const existingSnapshot = await getDocs(
    query(collection(db, 'employees'))
  );
  const existingMap = new Map<string, Employee>();
  existingSnapshot.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    existingMap.set(d.id, {
      employee_id: (data.employee_id as string) || d.id,
      employee_name: (data.employee_name as string) || '',
      department: data.department as Employee['department'],
      position: data.position as Employee['position'],
      building: data.building as Employee['building'],
      line: (data.line as string) || '',
      hire_date: (data.hire_date as string) || '',
      status: (data.status as Employee['status']) || 'ACTIVE',
      updated_at: '',
    });
  });

  // 4. 배치 쓰기 (500건 단위)
  const BATCH_SIZE = 500;
  const updates: Array<{ id: string; data: Record<string, unknown> }> = [];

  for (const hrEmp of hrEmployees) {
    const existing = existingMap.get(hrEmp.employee_id);

    if (!existing) {
      // 신규 직원 추가
      updates.push({
        id: hrEmp.employee_id,
        data: {
          employee_id: hrEmp.employee_id,
          employee_name: hrEmp.employee_name,
          department: hrEmp.team || 'NEW',
          position: hrEmp.position || 'PRO_WORKER',
          building: hrEmp.building || 'BUILDING_A',
          line: '',
          hire_date: hrEmp.entrance_date || '',
          status: hrEmp.is_active ? 'ACTIVE' : 'INACTIVE',
          _sync_source: 'HR_V2',
          _sync_timestamp: serverTimestamp(),
          updated_at: serverTimestamp(),
        },
      });
    } else {
      // 기존 직원 업데이트 (퇴사, 부서변경 등)
      const needsUpdate: Record<string, unknown> = {};
      let changed = false;

      if (hrEmp.resigned_this_month || !hrEmp.is_active) {
        if (existing.status !== 'INACTIVE') {
          needsUpdate.status = 'INACTIVE';
          changed = true;
        }
      }

      if (hrEmp.team && existing.department !== hrEmp.team) {
        needsUpdate.department = hrEmp.team;
        changed = true;
      }

      if (hrEmp.building && existing.building !== hrEmp.building) {
        needsUpdate.building = hrEmp.building;
        changed = true;
      }

      if (changed) {
        updates.push({
          id: hrEmp.employee_id,
          data: {
            ...needsUpdate,
            _sync_source: 'HR_V2',
            _sync_timestamp: serverTimestamp(),
            updated_at: serverTimestamp(),
          },
        });
      }
    }
  }

  // 배치 쓰기 실행
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const chunk = updates.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const update of chunk) {
      const docRef = doc(db, 'employees', update.id);
      const existing = existingMap.get(update.id);
      if (existing) {
        // 기존 문서 업데이트
        batch.update(docRef, update.data);
      } else {
        // 신규 문서 생성
        batch.set(docRef, update.data);
      }
    }

    try {
      await batch.commit();
      result.updatedCount += chunk.length;
    } catch (error) {
      const msg = `배치 ${Math.floor(i / BATCH_SIZE) + 1} 쓰기 실패: ${error}`;
      logger.error('[HRIntegration]', msg);
      result.errors.push(msg);
    }
  }

  // 동기화 기록 저장
  try {
    const syncLogRef = doc(db, 'hr_sync_logs', `${month}_${year}_${Date.now()}`);
    await setDoc(syncLogRef, {
      month,
      year,
      total_hr_employees: result.totalHREmployees,
      new_hires: result.newEmployees.length,
      resignations: result.resignedEmployees.length,
      department_changes: result.departmentChanges.length,
      building_changes: result.buildingChanges.length,
      updated_count: result.updatedCount,
      errors: result.errors,
      synced_at: serverTimestamp(),
    });
  } catch (error) {
    logger.warn('[HRIntegration] 동기화 로그 저장 실패:', error);
  }

  logger.info(
    `[HRIntegration] 동기화 완료: 총 ${result.totalHREmployees}명, ` +
    `신입 ${result.newEmployees.length}명, 퇴사 ${result.resignedEmployees.length}명, ` +
    `부서이동 ${result.departmentChanges.length}명, 건물이동 ${result.buildingChanges.length}명`
  );

  return result;
}

/**
 * 퇴사자를 Q-TRAIN에서 INACTIVE 상태로 전환합니다.
 */
export async function deactivateEmployee(employeeId: string): Promise<void> {
  try {
    const docRef = doc(db, 'employees', employeeId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      throw new Error(`직원 ${employeeId}을 찾을 수 없습니다.`);
    }

    await setDoc(docRef, {
      status: 'INACTIVE',
      _sync_source: 'HR_V2_DEACTIVATION',
      _sync_timestamp: serverTimestamp(),
      updated_at: serverTimestamp(),
    }, { merge: true });

    logger.info(`[HRIntegration] 직원 ${employeeId} 비활성화 완료`);
  } catch (error) {
    logger.error(`[HRIntegration] 직원 ${employeeId} 비활성화 실패:`, error);
    throw error;
  }
}

/**
 * HR V2 직원의 부서/건물 정보를 Q-TRAIN에 반영합니다.
 */
export async function updateEmployeeDepartment(
  employeeId: string,
  updates: { department?: string; building?: string },
): Promise<void> {
  try {
    const docRef = doc(db, 'employees', employeeId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      throw new Error(`직원 ${employeeId}을 찾을 수 없습니다.`);
    }

    await setDoc(docRef, {
      ...updates,
      _sync_source: 'HR_V2_UPDATE',
      _sync_timestamp: serverTimestamp(),
      updated_at: serverTimestamp(),
    }, { merge: true });

    logger.info(`[HRIntegration] 직원 ${employeeId} 정보 업데이트 완료`);
  } catch (error) {
    logger.error(`[HRIntegration] 직원 ${employeeId} 정보 업데이트 실패:`, error);
    throw error;
  }
}
