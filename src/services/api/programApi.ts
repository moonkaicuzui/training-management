// ============================================================
// Q-TRAIN Program API
// Training Program CRUD + Change Logs
// ============================================================

import { logger } from '@/utils/logger';

import * as programService from '../programService';
import * as logService from '../logService';

import type {
  TrainingProgram,
  ProgramFilters,
  ProgramChangeLog,
} from '@/types';

import { invalidateProgramCache } from './common';

// ========== Training Program API ==========

export async function getPrograms(filters?: ProgramFilters): Promise<TrainingProgram[]> {
  return programService.getPrograms(filters);
}

export async function getProgram(code: string): Promise<TrainingProgram | null> {
  return programService.getProgram(code);
}

export async function createProgram(
  program: Omit<TrainingProgram, 'created_at' | 'updated_at'>
): Promise<TrainingProgram> {
  const newProgram = await programService.createProgram(program);

  // Log the creation (non-blocking: log failure should not block program creation)
  try {
    await logService.logProgramChange(program.program_code, 'CREATE', null, newProgram);
  } catch (logError) {
    logger.error('[api] Failed to log program creation:', logError);
  }

  invalidateProgramCache();
  return newProgram;
}

export async function updateProgram(
  code: string,
  updates: Partial<TrainingProgram>
): Promise<TrainingProgram | null> {
  // Capture before state
  const beforeData = await programService.getProgram(code);
  if (!beforeData) return null;

  await programService.updateProgram(code, updates);

  // Re-fetch updated document
  const afterData = await programService.getProgram(code);

  // Log the update (non-blocking: log failure should not block program update)
  try {
    await logService.logProgramChange(code, 'UPDATE', beforeData, afterData);
  } catch (logError) {
    logger.error('[api] Failed to log program update:', logError);
  }

  invalidateProgramCache();
  return afterData;
}

export async function deleteProgram(code: string): Promise<boolean> {
  // Soft delete - set is_active to false (NO DELETE POLICY)
  const beforeData = await programService.getProgram(code);
  if (!beforeData) return false;

  await programService.deleteProgram(code);

  // Re-fetch for after state
  const afterData = await programService.getProgram(code);

  // Log the soft delete (non-blocking: log failure should not block program deletion)
  try {
    await logService.logProgramChange(code, 'DELETE', beforeData, afterData);
  } catch (logError) {
    logger.error('[api] Failed to log program deletion:', logError);
  }

  invalidateProgramCache();
  return true;
}

// ========== Change Log Functions ==========

export async function getProgramChangeLogs(
  programCode?: string
): Promise<ProgramChangeLog[]> {
  return logService.getProgramChangeLogs(programCode);
}
