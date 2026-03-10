import type { SessionFilters, TrainingSession } from '@/types';
import * as api from '@/services/api';
import { logger } from '@/utils/logger';
import i18n from '@/i18n';
import type { StoreSet, StoreGet } from './types';

export const createSessionActions = (set: StoreSet, get: StoreGet) => ({
  fetchSessions: async (filters?: SessionFilters) => {
    set((state) => ({ loading: { ...state.loading, sessions: true }, error: null }));
    try {
      const mergedFilters = { ...get().sessionFilters, ...filters };
      const sessions = await api.getSessions(mergedFilters);
      set({ sessions, sessionFilters: mergedFilters });
    } catch (error) {
      set({ error: i18n.t('errors.training.fetchSessionsFailed') });
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, sessions: false } }));
    }
  },

  setSessionFilters: (filters: SessionFilters) => {
    set({ sessionFilters: filters });
    get().fetchSessions(filters);
  },

  createSession: async (session: Omit<TrainingSession, 'session_id' | 'created_at'>) => {
    set({ error: null });
    try {
      const newSession = await api.createSession(session);
      set((state) => ({ sessions: [...state.sessions, newSession] }));
      return newSession;
    } catch (error) {
      logger.error('Failed to create session:', error);
      set({ error: i18n.t('errors.training.createSessionFailed') });
      throw error;
    }
  },

  updateSession: async (id: string, updates: Partial<TrainingSession>) => {
    set({ error: null });
    try {
      const updated = await api.updateSession(id, updates);
      if (updated) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.session_id === id ? updated : s
          ),
          selectedSession:
            state.selectedSession?.session_id === id
              ? updated
              : state.selectedSession,
        }));
      }
    } catch (error) {
      logger.error('Failed to update session:', error);
      set({ error: i18n.t('errors.training.updateSessionFailed') });
      throw error;
    }
  },

  cancelSession: async (id: string) => {
    set({ error: null });
    try {
      const success = await api.cancelSession(id);
      if (success) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.session_id === id ? { ...s, status: 'CANCELLED' as const } : s
          ),
        }));
      }
    } catch (error) {
      logger.error('Failed to cancel session:', error);
      set({ error: i18n.t('errors.training.cancelSessionFailed') });
      throw error;
    }
  },
});
