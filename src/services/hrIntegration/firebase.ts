/**
 * HR V2 Firebase 앱 초기화 + 유틸리티
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { HRSummary } from './types';

const HR_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_HR_API_KEY || '',
  authDomain: 'hr-dashboard-7521b.firebaseapp.com',
  projectId: 'hr-dashboard-7521b',
  storageBucket: 'hr-dashboard-7521b.firebasestorage.app',
  messagingSenderId: '1056281205538',
  appId: '1:1056281205538:web:bb6f3539182dccddbd637b',
};

const HR_APP_NAME = 'hr-v2';

export const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function getHRApp() {
  const existing = getApps().find((app) => app.name === HR_APP_NAME);
  if (existing) return existing;
  return initializeApp(HR_FIREBASE_CONFIG, HR_APP_NAME);
}

export function getHRFirestore() {
  return getFirestore(getHRApp());
}

export function getCurrentMonthYear(): { month: string; year: number } {
  const now = new Date();
  return { month: MONTH_NAMES[now.getMonth()], year: now.getFullYear() };
}

export function getPreviousMonth(month: string, year: number): { month: string; year: number } {
  const idx = MONTH_NAMES.indexOf(month);
  if (idx <= 0) return { month: MONTH_NAMES[11], year: year - 1 };
  return { month: MONTH_NAMES[idx - 1], year };
}

export function mapFirestoreToHRSummary(data: Record<string, unknown>, docId: string): HRSummary {
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
