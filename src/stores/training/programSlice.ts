import type { ProgramFilters, TrainingProgram } from '@/types';
import * as api from '@/services/api';
import { logger } from '@/utils/logger';
import i18n from '@/i18n';
import type { StoreSet, StoreGet } from './types';

export const createProgramActions = (set: StoreSet, get: StoreGet) => ({
  fetchPrograms: async (filters?: ProgramFilters) => {
    set((state) => ({ loading: { ...state.loading, programs: true }, error: null }));
    try {
      const mergedFilters = { ...get().programFilters, ...filters };
      const programs = await api.getPrograms(mergedFilters);
      set({ programs, programFilters: mergedFilters });
    } catch (error) {
      set({ error: i18n.t('errors.training.fetchProgramsFailed') });
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, programs: false } }));
    }
  },

  fetchProgram: async (code: string) => {
    set({ error: null });
    try {
      const program = await api.getProgram(code);
      set({ selectedProgram: program });
    } catch (error) {
      logger.error('Failed to fetch program:', error);
      set({ error: i18n.t('errors.training.fetchProgramsFailed') });
      throw error;
    }
  },

  setProgramFilters: (filters: ProgramFilters) => {
    set({ programFilters: filters });
    get().fetchPrograms(filters);
  },

  createProgram: async (program: Omit<TrainingProgram, 'created_at' | 'updated_at'>) => {
    set({ error: null });
    try {
      const newProgram = await api.createProgram(program);
      set((state) => ({ programs: [...state.programs, newProgram] }));
      return newProgram;
    } catch (error) {
      logger.error('Failed to create program:', error);
      set({ error: i18n.t('errors.training.createProgramFailed') });
      throw error;
    }
  },

  updateProgram: async (code: string, updates: Partial<TrainingProgram>) => {
    set({ error: null });
    try {
      const updated = await api.updateProgram(code, updates);
      if (updated) {
        set((state) => ({
          programs: state.programs.map((p) =>
            p.program_code === code ? updated : p
          ),
          selectedProgram:
            state.selectedProgram?.program_code === code
              ? updated
              : state.selectedProgram,
        }));
      }
    } catch (error) {
      logger.error('Failed to update program:', error);
      set({ error: i18n.t('errors.training.updateProgramFailed') });
      throw error;
    }
  },

  deleteProgram: async (code: string) => {
    set({ error: null });
    try {
      const success = await api.deleteProgram(code);
      if (success) {
        set((state) => ({
          programs: state.programs.map((p) =>
            p.program_code === code ? { ...p, is_active: false } : p
          ),
        }));
      }
    } catch (error) {
      logger.error('Failed to delete program:', error);
      set({ error: i18n.t('errors.training.deleteProgramFailed') });
      throw error;
    }
  },
});
