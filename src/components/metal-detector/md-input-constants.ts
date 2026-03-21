/**
 * MDInputForm 공유 상수, 타입, 세션 유틸리티
 */
import type { FactoryCode } from '@/types/metalDetector';

// ─── 공장 목록 ───
export const FACTORIES: { code: FactoryCode; label: string }[] = [
  { code: 'A', label: 'A' },
  { code: 'B', label: 'B' },
  { code: 'B3', label: 'B3' },
  { code: 'C', label: 'C' },
  { code: 'D', label: 'D' },
  { code: 'FGWH', label: 'FGWH' },
  { code: 'SCANPACK_AB', label: 'SP-AB' },
  { code: 'SCANPACK_C', label: 'SP-C' },
  { code: 'SCANPACK_D', label: 'SP-D' },
];

export const STEPS = ['factory', 'info', 'result'] as const;

const SESSION_KEY = 'md_quick_entry_session';

// ─── 구역별 라인 목록 (로컬 폴백) ───
export const LOCAL_FACTORY_LINES: Record<FactoryCode, string[]> = {
  A: [
    'L1-1','L1-2','L2-1','L2-2','L3-1','L3-2','L4-1','L4-2',
    'L5-1','L5-2','L6-1','L6-2','L7-1','L7-2','L8-1','L8-2',
    'L9-1','L9-2','L10-1','L10-2','L11-1','L11-2','L12-1','L12-2',
  ],
  B: [
    'L1-1','L1-2','L2-1','L2-2','L3-1','L3-2',
    'L4-1','L4-2','L5-1','L5-2','L6-1','L6-2',
  ],
  B3: ['L1','L2','L3','L4'],
  C: [
    'L1-1','L1-2','L2-1','L2-2','L3-1','L3-2','L4-1','L4-2',
    'L5-1','L5-2','L6-1','L6-2','L7-1','L7-2','L8-1','L8-2',
    'L9-1','L9-2','L10-1','L10-2','L11-1','L11-2','L12-1','L12-2',
  ],
  D: [
    'L1-1','L1-2','L2-1','L2-2','L3-1','L3-2','L4-1','L4-2',
    'L5-1','L5-2','L6-1','L6-2','L7-1','L7-2','L8-1','L8-2',
    'L9-1','L9-2','L10-1','L10-2','L11-1','L11-2','L12-1','L12-2',
  ],
  FGWH: ['1','2','3','4','5','6','7','8'],
  SCANPACK_AB: ['1','2','3','4','5','6','7','8'],
  SCANPACK_C: ['1','2','3','4','5','6','7','8'],
  SCANPACK_D: ['1','2','3','4','5','6','7','8'],
};

// ─── 폼 데이터 타입 ───
export interface MDFormData {
  factory: FactoryCode | '';
  line: string;
  machineId: string;
  inspectionDate: string;
  inspectorId: string;
  inspectorName: string;
  productName: string;
  result: 'PASS' | 'FAIL' | '';
  remarks: string;
  failureType: string;
  failureDescription: string;
}

// ─── 세션 저장/복원 ───
export function loadSession(): Partial<MDFormData> {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    if (data.inspectionDate === new Date().toISOString().split('T')[0]) {
      return data;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveSession(data: Partial<MDFormData>) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      factory: data.factory,
      inspectionDate: data.inspectionDate,
      inspectorId: data.inspectorId,
      inspectorName: data.inspectorName,
    }));
  } catch { /* ignore */ }
}
