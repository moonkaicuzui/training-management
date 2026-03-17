/**
 * Factory Line Service
 * Quality OS Firestore에서 공장/라인 정보를 동적으로 로드합니다.
 *
 * 1. localStorage 캐시 확인 (60분 TTL)
 * 2. Quality OS Firestore config/factory_lines 로드
 * 3. 실패 시 null 반환 → 호출측에서 로컬 상수 폴백 사용
 */
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { FactoryCode } from '@/types/metalDetector';

const QOS_CONFIG = {
  apiKey: import.meta.env.VITE_QOS_API_KEY || '',
  projectId: 'hwk-quality-os',
};
const QOS_APP_NAME = 'qos-lines';
const CACHE_KEY = 'hwk_factory_lines';
const CACHE_TTL = 60 * 60 * 1000; // 60분

function getQosDb() {
  const existing = getApps().find((a) => a.name === QOS_APP_NAME);
  const app = existing || initializeApp(QOS_CONFIG, QOS_APP_NAME);
  return getFirestore(app);
}

export interface FactoryLinesData {
  factories: Record<
    string,
    {
      name: { ko: string; en: string; vi: string };
      teams: string[];
      lines: Record<string, string[]>;
    }
  >;
  [key: string]: unknown;
}

/**
 * Quality OS에서 factory_lines 문서를 로드합니다.
 */
export async function getFactoryLines(): Promise<FactoryLinesData | null> {
  // 1. localStorage 캐시 확인
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return data as FactoryLinesData;
    }
  } catch {
    /* 캐시 파싱 실패 무시 */
  }

  // 2. Firestore에서 로드
  try {
    const db = getQosDb();
    const snap = await getDoc(doc(db, 'config', 'factory_lines'));
    if (snap.exists()) {
      const data = snap.data() as FactoryLinesData;
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      return data;
    }
  } catch (e) {
    console.warn('[factoryLineService] Firestore failed, using local fallback', (e as Error).message);
  }

  return null;
}

/**
 * Metal Detector용: 전체 건물의 Assembly 라인 추출
 * FactoryCode와 라인 매핑 반환
 */
export function extractMDFactoryLines(
  factoryData: FactoryLinesData
): Record<FactoryCode, string[]> | null {
  if (!factoryData?.factories) return null;

  // FactoryCode ↔ BUILDING_ID 매핑
  const CODE_MAP: Record<string, FactoryCode> = {
    BUILDING_A2: 'A',
    BUILDING_B2: 'B',
    BUILDING_B3: 'B3',
    BUILDING_C: 'C',
    BUILDING_D: 'D',
  };

  const result: Partial<Record<FactoryCode, string[]>> = {};

  Object.entries(factoryData.factories).forEach(([id, f]) => {
    const code = CODE_MAP[id];
    if (!code) return;

    if (id === 'BUILDING_B3') {
      // B3 = Repacking, 모든 라인 합산
      result[code] = Object.values(f.lines).flat();
    } else if (f.lines?.assembly) {
      result[code] = f.lines.assembly;
    }
  });

  // FGWH, SCANPACK 등은 Quality OS에 없으므로 변경하지 않음
  return Object.keys(result).length > 0 ? (result as Record<FactoryCode, string[]>) : null;
}
