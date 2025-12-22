// ============================================================
// Q-TRAIN Store Exports
// Unified store access point for gradual migration
// ============================================================

// Legacy store (array-based) - for existing components
export { useTrainingStore } from './trainingStore';

// UI store - language, sidebar, toasts, modals
export { useUIStore } from './uiStore';

// Normalized store (map-based) - for new/migrated components
export {
  useNormalizedTrainingStore,
  // Entity Selectors
  useSelectedEmployee,
  useSelectedProgram,
  useEmployeesList,
  useProgramsList,
  useSessionsList,
  useResultsList,
  // Legacy Compatibility Selectors
  useDashboardData,
  useEmployeesData,
  useProgramsData,
  useSessionsData,
  useResultsData,
  useProgressMatrixData,
  useRetrainingData,
} from './normalizedStore';

// Re-export types for convenience
export type {
  NormalizedEmployee,
  NormalizedTrainingProgram,
  NormalizedTrainingSession,
  NormalizedTrainingResultRecord,
  NormalizedProgressCell,
  NormalizedProgressMatrixData,
  NormalizedRetrainingTarget,
  NormalizedExpiringTraining,
  TrainingStatus,
} from '@/types/normalized';

export type {
  EmployeeId,
  ProgramCode,
  SessionId,
  ResultId,
} from '@/types/branded';
