// ============================================================
// Session Slice - Normalized Store
// ============================================================

import type { StateCreator } from 'zustand';
import type {
  NormalizedTrainingSession,
  NormalizedSessionFilters,
} from '@/types/normalized';
import type { SessionId, ProgramCode } from '@/types/branded';
import type { SessionFilters } from '@/types';
import type { NormalizedTrainingState } from './types';

import * as api from '@/services/api';
import { normalizeTrainingSessions } from '@/types/normalized';

// ============================================================
// Slice Actions
// ============================================================

export interface SessionSliceActions {
  fetchSessions: (filters?: NormalizedSessionFilters) => Promise<void>;
  getSession: (id: SessionId) => NormalizedTrainingSession | undefined;
  setSelectedSession: (id: SessionId | null) => void;
  addSession: (session: NormalizedTrainingSession) => void;
  updateSession: (id: SessionId, updates: Partial<NormalizedTrainingSession>) => void;
  cancelSession: (id: SessionId) => void;
  setSessionFilters: (filters: NormalizedSessionFilters) => void;
  getProgramSessions: (programCode: ProgramCode) => NormalizedTrainingSession[];
}

// ============================================================
// Slice Creator
// ============================================================

export const createSessionSlice: StateCreator<
  NormalizedTrainingState,
  [['zustand/devtools', never]],
  [],
  SessionSliceActions
> = (set, get) => ({
  fetchSessions: async (filters) => {
    set((state) => ({
      error: null,
      loading: {
        ...state.loading,
        entities: { ...state.loading.entities, sessions: true },
      },
    }));

    try {
      const legacyFilters: SessionFilters = filters ? {
        startDate: filters.startDate,
        endDate: filters.endDate,
        programCode: filters.programCode,
        status: filters.status,
      } : {};

      const rawSessions = await api.getSessions(legacyFilters);
      const sessions = normalizeTrainingSessions(rawSessions);

      const sessionMap = new Map<SessionId, NormalizedTrainingSession>();
      const sessionsByProgram = new Map<ProgramCode, Set<SessionId>>();

      sessions.forEach(sess => {
        sessionMap.set(sess.session_id, sess);

        // Build index
        const programSessions = sessionsByProgram.get(sess.program_code) || new Set();
        programSessions.add(sess.session_id);
        sessionsByProgram.set(sess.program_code, programSessions);
      });

      set((state) => ({
        entities: { ...state.entities, sessions: sessionMap },
        indexes: { ...state.indexes, sessionsByProgram },
        filters: { ...state.filters, sessions: filters || {} },
      }));
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      set({ error: 'Failed to fetch sessions' });
      throw error;
    } finally {
      set((state) => ({
        loading: {
          ...state.loading,
          entities: { ...state.loading.entities, sessions: false },
        },
      }));
    }
  },

  getSession: (id) => {
    return get().entities.sessions.get(id);
  },

  setSelectedSession: (id) => {
    set((state) => ({
      ui: { ...state.ui, selectedSessionId: id },
    }));
  },

  addSession: (session) => {
    set((state) => {
      const newSessions = new Map(state.entities.sessions);
      newSessions.set(session.session_id, session);

      // Update index
      const newSessionsByProgram = new Map(state.indexes.sessionsByProgram);
      const programSessions = newSessionsByProgram.get(session.program_code) || new Set();
      programSessions.add(session.session_id);
      newSessionsByProgram.set(session.program_code, programSessions);

      return {
        entities: { ...state.entities, sessions: newSessions },
        indexes: { ...state.indexes, sessionsByProgram: newSessionsByProgram },
      };
    });
  },

  updateSession: (id, updates) => {
    set((state) => {
      const session = state.entities.sessions.get(id);
      if (!session) return state;

      const updated = { ...session, ...updates };
      const newSessions = new Map(state.entities.sessions);
      newSessions.set(id, updated);

      return {
        entities: { ...state.entities, sessions: newSessions },
      };
    });
  },

  cancelSession: (id) => {
    get().updateSession(id, { status: 'CANCELLED' });
  },

  setSessionFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, sessions: filters },
    }));
    get().fetchSessions(filters);
  },

  getProgramSessions: (programCode) => {
    const sessionIds = get().indexes.sessionsByProgram.get(programCode) || new Set();
    const sessions: NormalizedTrainingSession[] = [];

    sessionIds.forEach((id) => {
      const session = get().entities.sessions.get(id);
      if (session) sessions.push(session);
    });

    return sessions.sort((a, b) =>
      b.session_date.localeCompare(a.session_date)
    );
  },
});
