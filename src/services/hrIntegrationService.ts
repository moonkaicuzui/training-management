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
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { logger } from '@/utils/logger';

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
