import type {
  NewTQCResignationFilters,
  NewTQCResignationInput,
} from '@/types';
import * as api from '@/services/api';
import type { StoreSet, StoreGet } from './types';

export const createResignationActions = (set: StoreSet, get: StoreGet) => ({
  fetchResignations: async (filters?: NewTQCResignationFilters) => {
    set(state => ({
      loading: { ...state.loading, resignations: true },
      error: null,
      resignationFilters: filters || state.resignationFilters,
    }));

    try {
      const resignations = await api.getNewTQCResignations(
        filters || get().resignationFilters
      );
      set({ resignations, loading: { ...get().loading, resignations: false } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch resignations';
      set({
        error: message,
        loading: { ...get().loading, resignations: false },
      });
    }
  },

  fetchResignationAnalysis: async () => {
    set(state => ({
      loading: { ...state.loading, analysis: true },
      error: null,
    }));

    try {
      const resignationAnalysis = await api.getNewTQCResignationAnalysis();
      set({ resignationAnalysis, loading: { ...get().loading, analysis: false } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch resignation analysis';
      set({
        error: message,
        loading: { ...get().loading, analysis: false },
      });
    }
  },

  setResignationFilters: (filters: NewTQCResignationFilters) => {
    set({ resignationFilters: filters });
  },

  createResignation: async (input: NewTQCResignationInput) => {
    set(state => ({
      loading: { ...state.loading, saving: true },
      error: null,
    }));

    try {
      const newResignation = await api.createNewTQCResignation(input);

      set(state => ({
        trainees: state.trainees.map(t =>
          t.trainee_id === input.trainee_id ? { ...t, status: 'RESIGNED' as const } : t
        ),
        resignations: [newResignation, ...state.resignations],
        loading: { ...state.loading, saving: false },
      }));

      return newResignation;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create resignation';
      set({
        error: message,
        loading: { ...get().loading, saving: false },
      });
      throw error;
    }
  },
});
