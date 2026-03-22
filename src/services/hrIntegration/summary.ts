/**
 * HR Summary 조회 + 동기화 (폴백 로직 포함)
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { HRSummary } from './types';
import { getHRFirestore, getCurrentMonthYear, mapFirestoreToHRSummary } from './firebase';

async function fetchFromHRV2(month: string, year: number): Promise<HRSummary | null> {
  try {
    const hrDb = getHRFirestore();
    const docId = `${month}_${year}`;
    const docRef = doc(hrDb, 'hr_dashboard_summary', docId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) { logger.info('[HRIntegration] HR V2에 해당 월 데이터 없음:', docId); return null; }
    logger.info('[HRIntegration] HR V2 직접 읽기 성공:', docId);
    return mapFirestoreToHRSummary(snapshot.data(), docId);
  } catch (error) {
    logger.warn('[HRIntegration] HR V2 직접 읽기 실패 (폴백 시도):', error);
    return null;
  }
}

async function fetchFromLocalSync(month: string, year: number): Promise<HRSummary | null> {
  try {
    const docId = `${month}_${year}`;
    const docRef = doc(db, 'hr_sync_summary', docId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) { logger.info('[HRIntegration] 로컬 동기화 데이터 없음:', docId); return null; }
    logger.info('[HRIntegration] 로컬 동기화 데이터 읽기 성공:', docId);
    return mapFirestoreToHRSummary(snapshot.data(), docId);
  } catch (error) {
    logger.error('[HRIntegration] 로컬 동기화 읽기 실패:', error);
    return null;
  }
}

export async function syncHRSummaryToLocal(month: string, year: number): Promise<HRSummary | null> {
  const hrData = await fetchFromHRV2(month, year);
  if (!hrData) { logger.warn('[HRIntegration] HR V2에서 동기화할 데이터 없음'); return null; }
  try {
    const docId = `${month}_${year}`;
    const docRef = doc(db, 'hr_sync_summary', docId);
    await setDoc(docRef, {
      total_headcount: hrData.totalHeadcount, active_headcount: hrData.activeHeadcount,
      new_hires: hrData.newHires, resignations: hrData.resignations,
      attendance_rate: hrData.attendanceRate, absence_rate: hrData.absenceRate,
      unauthorized_absence_rate: hrData.unauthorizedAbsenceRate, turnover_rate: hrData.turnoverRate,
      aql_pass_rate: hrData.aqlPassRate, five_prs_pass_rate: hrData.fivePrsPassRate,
      avg_tenure: hrData.avgTenure, synced_at: new Date().toISOString(), updated_at: serverTimestamp(),
    });
    logger.info('[HRIntegration] Q-TRAIN에 HR 요약 동기화 완료:', docId);
    return { ...hrData, syncedAt: new Date().toISOString() };
  } catch (error) {
    logger.error('[HRIntegration] Q-TRAIN 동기화 저장 실패:', error);
    return null;
  }
}

export async function getHRSummary(month: string, year: number): Promise<HRSummary | null> {
  const hrData = await fetchFromHRV2(month, year);
  if (hrData) return hrData;
  return fetchFromLocalSync(month, year);
}

export async function getCurrentHRSummary(): Promise<HRSummary | null> {
  const { month, year } = getCurrentMonthYear();
  return getHRSummary(month, year);
}

export async function syncCurrentHRSummary(): Promise<HRSummary | null> {
  const { month, year } = getCurrentMonthYear();
  return syncHRSummaryToLocal(month, year);
}
