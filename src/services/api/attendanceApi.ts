// ============================================================
// Q-TRAIN Attendance API
// Bulk attendance management
// ============================================================

import { logger } from '@/utils/logger';

import * as attendanceService from '../attendanceService';

import type { BulkAttendanceInput, Attendance } from '@/types';

// ========== Attendance API ==========

export async function saveBulkAttendance(input: BulkAttendanceInput): Promise<Attendance[]> {
  const savedRecords = await attendanceService.saveBulkAttendance(input);
  logger.log('Attendance saved:', savedRecords.length, 'records');
  return savedRecords;
}
