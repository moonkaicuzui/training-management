// ============================================================
// Q-TRAIN Session API
// Training Session management
// ============================================================

import * as sessionService from '../sessionService';

import type {
  TrainingSession,
  SessionFilters,
} from '@/types';

import { invalidateSessionCache } from './common';

// ========== Training Session API ==========

export async function getSessions(filters?: SessionFilters): Promise<TrainingSession[]> {
  return sessionService.getSessions(filters);
}

export async function createSession(
  session: Omit<TrainingSession, 'session_id' | 'created_at'>
): Promise<TrainingSession> {
  const result = await sessionService.createSession(session);
  invalidateSessionCache();
  return result;
}

export async function updateSession(
  id: string,
  updates: Partial<TrainingSession>
): Promise<TrainingSession | null> {
  await sessionService.updateSession(id, updates);
  invalidateSessionCache();
  return sessionService.getSession(id);
}

export async function cancelSession(id: string): Promise<boolean> {
  const session = await sessionService.getSession(id);
  if (!session) return false;

  await sessionService.cancelSession(id);
  invalidateSessionCache();
  return true;
}
