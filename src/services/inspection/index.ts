export {
  createInspectionResult,
  getInspectionDetail,
  getResultsByEmployee,
  getAllResults,
} from './resultService';

export {
  getConsecutiveFailures,
  handleThreeStrikeOut,
} from './strikeService';

export {
  checkDuplicateEnrollment,
  createEnrollment,
  getEnrollments,
  updateEnrollmentStatus,
  autoEnrollFromLogs,
} from './enrollmentService';
