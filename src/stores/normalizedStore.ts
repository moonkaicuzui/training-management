// ============================================================
// Normalized Training Store - Re-export for backward compatibility
// Actual implementation is in ./normalized/
// ============================================================

export {
  useNormalizedTrainingStore,
  useSelectedEmployee,
  useSelectedProgram,
  useEmployeesList,
  useProgramsList,
  useSessionsList,
  useResultsList,
  useDashboardData,
  useEmployeesData,
  useProgramsData,
  useSessionsData,
  useResultsData,
  useProgressMatrixData,
  useRetrainingData,
} from './normalized';

export type { NormalizedTrainingState } from './normalized';
