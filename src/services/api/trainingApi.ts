// ============================================================
// Q-TRAIN Training API - Re-export Hub
// Split into domain-specific modules for maintainability.
// All exports maintained for backward compatibility.
// ============================================================

// Employee API
export {
  getEmployees,
  getEmployee,
  getEmployeeHistory,
  createEmployee,
  updateEmployee,
  batchUpsertEmployees,
} from './employeeApi';

// Program API
export {
  getPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramChangeLogs,
} from './programApi';

// Session API
export {
  getSessions,
  createSession,
  updateSession,
  cancelSession,
} from './sessionApi';

// Result API
export {
  getResults,
  recordResults,
  updateResult,
  getResultEditLogs,
} from './resultApi';

// Analytics API (Dashboard, Progress, Retraining, Search, Certification Expiry)
export {
  getDashboardStats,
  getMonthlyTrainingData,
  getGradeDistribution,
  getProgressMatrix,
  getRetrainingTargets,
  getExpiringTrainings,
  getExpiredTrainings,
  globalSearch,
  checkAndCreateExpiryNotifications,
} from './analyticsApi';

// New TQC API
export {
  getNewTQCTeams,
  getNewTQCTeamById,
  createNewTQCTeam,
  updateNewTQCTeam,
  deleteNewTQCTeam,
  getNewTQCTrainees,
  getNewTQCTraineeById,
  getNewTQCTraineeWithDetails,
  createNewTQCTrainee,
  updateNewTQCTrainee,
  getNewTQCColorBlindTests,
  createNewTQCColorBlindTest,
  getNewTQCTrainingStages,
  updateNewTQCTrainingStage,
  getNewTQCMeetings,
  createNewTQCMeeting,
  updateNewTQCMeeting,
  getNewTQCResignations,
  createNewTQCResignation,
  getNewTQCDashboardStats,
  getNewTQCResignationAnalysis,
  getNewTQCUpcomingMeetings,
} from './newTqcApi';

// Attendance API
export {
  saveBulkAttendance,
} from './attendanceApi';
