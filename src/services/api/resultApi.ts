// ============================================================
// Q-TRAIN Result API
// Training Result management (NO DELETE POLICY)
// ============================================================

import * as programService from '../programService';
import * as resultService from '../resultService';
import * as logService from '../logService';
import { updateResultWithLog } from '@/services/firebase';

import type {
  TrainingResultRecord,
  ResultFilters,
  ResultInput,
  ResultUpdate,
  ResultEditLog,
} from '@/types';

import {
  calculateGrade,
  invalidateResultCache,
  invalidateDashboardCache,
} from './common';

// ========== Training Result API ==========

export async function getResults(filters?: ResultFilters): Promise<TrainingResultRecord[]> {
  return resultService.getResults(filters);
}

export async function recordResults(results: ResultInput[]): Promise<TrainingResultRecord[]> {
  const programs = await programService.getPrograms();
  const newResults: TrainingResultRecord[] = [];

  for (const input of results) {
    const program = programs.find(p => p.program_code === input.program_code);
    if (!program) continue;

    const grade =
      input.score !== null
        ? calculateGrade(input.score, program.grade_aa, program.grade_a, program.grade_b)
        : null;

    const needsRetraining = input.result === 'FAIL' || input.result === 'ABSENT';

    const resultData = {
      session_id: input.session_id || null,
      employee_id: input.employee_id,
      program_code: input.program_code,
      training_date: input.training_date,
      score: input.score,
      grade,
      result: input.result,
      needs_retraining: needsRetraining,
      evaluated_by: input.evaluated_by,
      remarks: input.remarks || '',
    };

    const created = await resultService.createResult(resultData);
    newResults.push(created);
  }

  invalidateResultCache();
  invalidateDashboardCache();
  return newResults;
}

export async function updateResult(update: ResultUpdate): Promise<TrainingResultRecord | null> {
  // NOTE: This updates a result and logs the change (NO DELETE POLICY)
  const existing = await resultService.getResult(update.result_id);
  if (!existing) return null;

  const programs = await programService.getPrograms();
  const program = programs.find(p => p.program_code === existing.program_code);

  let newGrade = existing.grade;
  let newNeedsRetraining = existing.needs_retraining;

  if (update.score !== undefined && program) {
    newGrade =
      update.score !== null
        ? calculateGrade(update.score, program.grade_aa, program.grade_a, program.grade_b)
        : null;
  }

  if (update.result !== undefined) {
    newNeedsRetraining = update.result === 'FAIL' || update.result === 'ABSENT';
  }

  const updates: Partial<TrainingResultRecord> = {
    score: update.score !== undefined ? update.score : existing.score,
    grade: newGrade,
    result: update.result || existing.result,
    remarks: update.remarks !== undefined ? update.remarks : existing.remarks,
    needs_retraining: newNeedsRetraining,
    updated_by: 'current_user',
  };

  // Atomic transaction: update result + create edit log together
  await updateResultWithLog(update.result_id, updates, {
    edited_by: 'current_user',
    edit_reason: update.edit_reason || '결과 수정',
    after_data: JSON.stringify(updates),
  });

  // Re-fetch updated result for return
  const afterData = await resultService.getResult(update.result_id);

  invalidateResultCache();
  invalidateDashboardCache();
  return afterData;
}

// ========== Result Edit Log Functions ==========

export async function getResultEditLogs(
  resultId?: string
): Promise<ResultEditLog[]> {
  return logService.getResultEditLogs(resultId);
}
