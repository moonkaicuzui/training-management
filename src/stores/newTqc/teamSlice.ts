import type { NewTQCTeamInput, NewTQCTeamUpdate } from '@/types';
import * as api from '@/services/api';
import type { StoreSet, StoreGet } from './types';

export const createTeamActions = (set: StoreSet, get: StoreGet) => ({
  fetchTeams: async (includeInactive = false) => {
    set(state => ({
      loading: { ...state.loading, teams: true },
      error: null,
    }));

    try {
      const teams = await api.getNewTQCTeams(includeInactive);
      set({ teams, loading: { ...get().loading, teams: false } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch teams';
      set({
        error: message,
        loading: { ...get().loading, teams: false },
      });
    }
  },

  createTeam: async (input: NewTQCTeamInput) => {
    set(state => ({
      loading: { ...state.loading, saving: true },
      error: null,
    }));

    try {
      const newTeam = await api.createNewTQCTeam(input);
      set(state => ({
        teams: [...state.teams, newTeam],
        loading: { ...state.loading, saving: false },
      }));
      return newTeam;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create team';
      set({
        error: message,
        loading: { ...get().loading, saving: false },
      });
      throw error;
    }
  },

  updateTeam: async (input: NewTQCTeamUpdate) => {
    set(state => ({
      loading: { ...state.loading, saving: true },
      error: null,
    }));

    try {
      const updatedTeam = await api.updateNewTQCTeam(input);
      if (updatedTeam) {
        set(state => ({
          teams: state.teams.map(t =>
            t.team_id === input.team_id ? updatedTeam : t
          ),
          loading: { ...state.loading, saving: false },
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update team';
      set({
        error: message,
        loading: { ...get().loading, saving: false },
      });
      throw error;
    }
  },

  deleteTeam: async (teamId: string) => {
    set(state => ({
      loading: { ...state.loading, saving: true },
      error: null,
    }));

    try {
      await api.deleteNewTQCTeam(teamId);
      set(state => ({
        teams: state.teams.map(t =>
          t.team_id === teamId
            ? { ...t, is_active: false, updated_at: new Date().toISOString() }
            : t
        ),
        loading: { ...state.loading, saving: false },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to deactivate team';
      set({
        error: message,
        loading: { ...get().loading, saving: false },
      });
      throw error;
    }
  },
});
