/**
 * HR V2 Cross-Project Integration Service
 *
 * HR V2 Firestore 연동, 동기화, 변경 감지를 하위 모듈로 분할하여 re-export합니다.
 * 기존 import 경로 호환성을 유지합니다.
 */

// 타입 re-export
export type {
  HREmployeeRecord,
  HRChangeType,
  HRChangeEvent,
  HRSyncResult,
  HRSummary,
} from './hrIntegration/types';

// Summary (HR 요약 조회 + 동기화)
export {
  syncHRSummaryToLocal,
  getHRSummary,
  getCurrentHRSummary,
  syncCurrentHRSummary,
} from './hrIntegration/summary';

// Sync (직원 데이터 읽기, 변경 감지, Q-TRAIN 동기화)
export {
  fetchHREmployees,
  detectHRChanges,
  syncEmployeesFromHR,
  deactivateEmployee,
  updateEmployeeDepartment,
} from './hrIntegration/sync';
