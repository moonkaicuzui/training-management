// ============================================================
// Q-TRAIN API Service - Re-export Hub
// All exports maintained for backward compatibility
// Import from '@/services/api' works as before
// ============================================================

// Common utilities (errors, cache, retry, grade)
export {
  ApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
  NotFoundError,
  apiCache,
  withRetry,
  invalidateEmployeeCache,
  invalidateProgramCache,
  invalidateSessionCache,
  invalidateResultCache,
  invalidateDashboardCache,
  invalidateMaterialCache,
  invalidateEvaluationCache,
  invalidateNotificationCache,
  invalidateCertificateCache,
  invalidateAllCache,
  calculateGrade,
  calculateResult,
} from './common';

// Training API (employees, programs, sessions, results, dashboard, TQC, attendance)
export {
  getEmployees,
  getEmployee,
  getEmployeeHistory,
  createEmployee,
  updateEmployee,
  batchUpsertEmployees,
  getPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  getSessions,
  createSession,
  updateSession,
  cancelSession,
  getResults,
  recordResults,
  updateResult,
  getProgramChangeLogs,
  getResultEditLogs,
  getDashboardStats,
  getMonthlyTrainingData,
  getGradeDistribution,
  getProgressMatrix,
  getRetrainingTargets,
  getExpiringTrainings,
  getExpiredTrainings,
  globalSearch,
  // New TQC
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
  // Attendance
  saveBulkAttendance,
  // Certification Expiry Notifications
  checkAndCreateExpiryNotifications,
} from './trainingApi';

// Quality API (inspection, metal detector, metal shoe)
export {
  getInspectionResults,
  getInspectionResultsByEmployee,
  getInspectionDetail,
  createInspectionResult,
  getInspectionEnrollments,
  createInspectionEnrollment,
  checkDuplicateInspectionEnrollment,
  updateInspectionEnrollmentStatus,
  getInspectionConsecutiveFailures,
  autoEnrollInspectionFromLogs,
  mdInspection,
  metalShoe,
} from './qualityApi';

// CAPA API
export {
  getCAPAs,
  getCAPA,
  createCAPA,
  updateCAPA,
  updateCAPAStage,
  getAllCAPAs,
} from './capaApi';

// Project API (settings, ROI, member auth)
export {
  getProjectSettings,
  updateProjectSettings,
  getProjectMemberByUid,
  getProjectMemberByEmail,
  linkProjectMemberToAuth,
  getTrainingCosts,
  saveTrainingCost,
} from './projectApi';

// Admin API (materials, evaluations, notifications, audit, trainers, certificates, competency, tech, stickers)
export {
  // Materials
  getMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  // Evaluations
  getEvaluations,
  getEvaluation,
  getEvaluationsByProgram,
  createEvaluation,
  updateEvaluation,
  // Notifications
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  batchDeleteNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  // Audit Logs
  getAuditLogs,
  createAuditLog,
  // Trainers
  getTrainers,
  getTrainer,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  // Training Plans
  getTrainingPlans,
  getTrainingPlan,
  createTrainingPlan,
  updateTrainingPlan,
  deleteTrainingPlan,
  // Audit Compliance
  getAuditMetrics,
  updateAuditMetric,
  createAuditMetric,
  getAuditFindings,
  createAuditFinding,
  getCorrectiveActions,
  createCorrectiveAction,
  updateCorrectiveAction,
  // Certificates
  getCertificates,
  getCertificate,
  createCertificate,
  createCertificatesBatch,
  revokeCertificate,
  getCertificateTemplates,
  getCertificateTemplate,
  createCertificateTemplate,
  updateCertificateTemplate,
  deleteCertificateTemplate,
  // Competency
  getCompetencies,
  createCompetency,
  updateCompetency,
  deleteCompetency,
  getEmployeeCompetencies,
  updateEmployeeCompetency,
  getLearningPaths,
  createLearningPath,
  updateLearningPath,
  getEmployeeLearningPaths,
  updateEmployeeLearningPath,
  getDevelopmentPlans,
  createDevelopmentPlan,
  updateDevelopmentPlan,
  // Tech Model
  techModel,
  // Inspector Sticker
  inspectorSticker,
} from './adminApi';

// Re-export types from adminApi
export type { Certificate, CertificateTemplate, CertificateFilters } from './adminApi';

// HR Integration API
export {
  getCurrentHRSummary,
  syncCurrentHRSummary,
  detectHRChanges,
  syncEmployeesFromHR,
  deactivateEmployee,
} from './hrIntegrationApi';
export type { HRSummary, HRChangeEvent, HRSyncResult } from './hrIntegrationApi';

// Sync API
export {
  SYNC_COLLECTIONS,
  triggerSync,
  triggerSyncAll,
} from './syncApi';
export type { SyncDirection, SyncResult } from './syncApi';

// AQL API (additional)
export { getAqlEnrollmentLogs } from './aqlApi';

// Executive Report API
export { generateExecutiveReport } from './executiveReportApi';

// HR Analytics API
export {
  analyzeTrainingEffectiveness,
  getHighRiskTrainingRecommendations,
  getNewHireTrainingStatus,
  compareQualityData,
  getDepartmentTrainingRates,
  analyzeTurnoverTrainingCorrelation,
} from './hrAnalyticsApi';
export type {
  TrainingEffectivenessResult,
  RiskBasedRecommendation,
  NewHireTrainingStatus,
  QualitySync,
  DepartmentTrainingRate,
  TurnoverTrainingCorrelation,
} from './hrAnalyticsApi';

// Blog API
export { uploadBlogImage, uploadBlogImages } from './blogApi';

// Feedback API
export {
  getAllFeedback,
  getFeedback,
  createFeedback,
  updateFeedbackStatus,
  addFeedbackComment,
  uploadFeedbackScreenshots,
} from './feedbackApi';

// Trainer Directive API
export {
  getTodayDirective,
  getRecentDirectives,
  markDirectiveAsRead,
  acknowledgeDirective,
  getEffectivenessReports,
} from './trainerDirectiveApi';

// 5PRS API (additional)
export { autoEnrollFromRecommendations } from './fivePrsApi';

// Factory Line API
export { getFactoryLines, extractMDFactoryLines } from './factoryLineApi';

// Recommendation API (5PRS training recommendations)
export {
  getRecommendationThresholds,
  updateRecommendationThresholds,
  getRecommendationMappings,
  createRecommendationMapping,
  updateRecommendationMapping,
  deleteRecommendationMapping,
  getRecommendationLinks,
  createRecommendationLink,
  deleteRecommendationLink,
  getRecommendationEnrollmentLogs,
  createRecommendationEnrollmentLog,
} from './recommendationApi';
