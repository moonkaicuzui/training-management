/**
 * Metal Shoe Sync Service
 * Q-TRAIN → Return Dashboard 이슈 자동 등록 + 액션 동기화
 *
 * Return Dashboard의 qualityIssues 컬렉션에 금속 발견 케이스를 자동 등록하고,
 * 업체 액션플랜 상태를 역방향 동기화합니다.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { MetalShoeCase } from '../types/metalShoe';
import { logger } from '@/utils/logger';

// Return Dashboard Firebase config
const RETURN_DASHBOARD_CONFIG = {
  apiKey: import.meta.env.VITE_RETURN_DASHBOARD_API_KEY || '',
  authDomain: 'return-dashboard-7994c.firebaseapp.com',
  projectId: 'return-dashboard-7994c',
};

/**
 * Return Dashboard Firestore 인스턴스 (싱글턴)
 */
function getReturnDashboardDb() {
  const appName = 'qtrain-return-dashboard';
  const existing = getApps().find((a) => a.name === appName);
  const app = existing || initializeApp(RETURN_DASHBOARD_CONFIG, appName);
  return getFirestore(app);
}

/**
 * Q-TRAIN 케이스 → Return Dashboard qualityIssues 자동 등록
 * @param metalCase - 금속 발견 케이스 데이터
 * @param user - 등록자 정보
 * @returns 생성된 Return Dashboard 문서 ID (실패 시 null)
 */
export async function syncCaseToReturnDashboard(
  metalCase: MetalShoeCase,
  user: { uid: string; email: string; displayName: string }
): Promise<string | null> {
  try {
    const db = getReturnDashboardDb();
    const issueData = {
      // Standard Return Dashboard fields
      supplierId: metalCase.supplierId,
      supplierName: metalCase.supplierName,
      model: metalCase.model,
      article: metalCase.pgsc,
      issueDate: metalCase.detectionDate,
      registeredDate: metalCase.detectionDate,
      issueCategory: 'SPEC_QC',
      issueCategoryName: { ko: '규격/QC', en: 'Spec/QC', vi: 'Quy cách/QC' },
      defectType: 'metalFound',
      defectTypes: ['metalFound'],
      defectTypeName: 'Metal Found',
      defectTypeNames: ['Metal Found'],
      description: `Metal found in ${metalCase.component} (${metalCase.side}) - Factory: ${metalCase.factory}, Line: ${metalCase.line || '-'}`,
      status: 'monitoring',
      shareType: null,
      shareWithAll: false,
      issuePhotos: [],
      // Q-TRAIN source tracking
      _sourceSystem: 'q-train',
      _sourceCaseId: metalCase.id,
      _sourceModule: 'metal_shoe',
      // Audit
      createdAt: serverTimestamp(),
      createdBy: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'qualityIssues'), issueData);
    return docRef.id;
  } catch (error) {
    logger.error('[MetalShoeSyncService] Failed to sync to Return Dashboard:', error);
    return null;
  }
}

/**
 * Return Dashboard에서 액션플랜 동기화 (수동 트리거)
 * @param returnDashboardIssueId - Return Dashboard 문서 ID
 * @returns 액션 목록 + 상태 (실패 시 null)
 */
export async function syncActionFromReturnDashboard(
  returnDashboardIssueId: string
): Promise<{ actions: unknown[]; status: string } | null> {
  try {
    const db = getReturnDashboardDb();
    const issueRef = doc(db, 'qualityIssues', returnDashboardIssueId);
    const issueSnap = await getDoc(issueRef);

    if (!issueSnap.exists()) return null;

    const data = issueSnap.data();
    return {
      actions: data.actions || [],
      status: data.status || 'monitoring',
    };
  } catch (error) {
    logger.error('[MetalShoeSyncService] Failed to sync actions:', error);
    return null;
  }
}
