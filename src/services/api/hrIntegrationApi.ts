// ============================================================
// Q-TRAIN API - HR Integration Wrapper
// ============================================================

import {
  getCurrentHRSummary as _getCurrentHRSummary,
  syncCurrentHRSummary as _syncCurrentHRSummary,
  detectHRChanges as _detectHRChanges,
  syncEmployeesFromHR as _syncEmployeesFromHR,
  deactivateEmployee as _deactivateEmployee,
} from '@/services/hrIntegrationService';

// Re-export types for convenience
export type { HRSummary, HRChangeEvent, HRSyncResult } from '@/services/hrIntegrationService';

export const getCurrentHRSummary = _getCurrentHRSummary;
export const syncCurrentHRSummary = _syncCurrentHRSummary;
export const detectHRChanges = _detectHRChanges;
export const syncEmployeesFromHR = _syncEmployeesFromHR;
export const deactivateEmployee = _deactivateEmployee;
