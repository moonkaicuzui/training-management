/**
 * Metal Detector Inspection Firebase Service
 *
 * CRUD, Analytics, Email Recipients를 하위 모듈로 분할하여 re-export합니다.
 * 기존 import 경로 호환성을 유지합니다.
 */

// CRUD operations
export {
  getInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  getFailures,
  createFailure,
  updateFailure,
  getEmailRecipients,
  addEmailRecipient,
  updateEmailRecipient,
  removeEmailRecipient,
  getRecipientsForNotification,
} from './mdInspection/crud';

// Analytics & Dashboard
export {
  getDashboardKPIs,
  getWeeklyTrend,
  getWeeklyComparison,
  getRepeatedIssues,
} from './mdInspection/analytics';
