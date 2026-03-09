// ============================================================
// Program Slice - Normalized Store
// ============================================================

import { logger } from '@/utils/logger';
import type { StateCreator } from 'zustand';
import type {
  NormalizedTrainingProgram,
  NormalizedProgramFilters,
} from '@/types/normalized';
import type { ProgramCode } from '@/types/branded';
import type { ProgramFilters } from '@/types';
import type { NormalizedTrainingState } from './types';

import * as api from '@/services/api';
import { normalizeTrainingPrograms } from '@/types/normalized';

// ============================================================
// Slice Actions
// ============================================================

export interface ProgramSliceActions {
  fetchPrograms: (filters?: NormalizedProgramFilters) => Promise<void>;
  getProgram: (code: ProgramCode) => NormalizedTrainingProgram | undefined;
  setSelectedProgram: (code: ProgramCode | null) => void;
  addProgram: (program: NormalizedTrainingProgram) => void;
  updateProgram: (code: ProgramCode, updates: Partial<NormalizedTrainingProgram>) => void;
  deactivateProgram: (code: ProgramCode) => void;
  setProgramFilters: (filters: NormalizedProgramFilters) => void;
}

// ============================================================
// Slice Creator
// ============================================================

export const createProgramSlice: StateCreator<
  NormalizedTrainingState,
  [['zustand/devtools', never]],
  [],
  ProgramSliceActions
> = (set, get) => ({
  fetchPrograms: async (filters) => {
    set((state) => ({
      error: null,
      loading: {
        ...state.loading,
        entities: { ...state.loading.entities, programs: true },
      },
    }));

    try {
      const legacyFilters: ProgramFilters = filters ? {
        category: filters.category,
        showInactive: filters.showInactive,
        search: filters.search,
        tags: filters.tags ? [...filters.tags] : undefined,
      } : {};

      const rawPrograms = await api.getPrograms(legacyFilters);
      const programs = normalizeTrainingPrograms(rawPrograms);

      const programMap = new Map<ProgramCode, NormalizedTrainingProgram>();
      programs.forEach(prog => programMap.set(prog.program_code, prog));

      set((state) => ({
        entities: { ...state.entities, programs: programMap },
        filters: { ...state.filters, programs: filters || {} },
      }));
    } catch (error) {
      logger.error('Failed to fetch programs:', error);
      set({ error: 'Failed to fetch programs' });
      throw error;
    } finally {
      set((state) => ({
        loading: {
          ...state.loading,
          entities: { ...state.loading.entities, programs: false },
        },
      }));
    }
  },

  getProgram: (code) => {
    return get().entities.programs.get(code);
  },

  setSelectedProgram: (code) => {
    set((state) => ({
      ui: { ...state.ui, selectedProgramCode: code },
    }));
  },

  addProgram: (program) => {
    set((state) => {
      const newPrograms = new Map(state.entities.programs);
      newPrograms.set(program.program_code, program);
      return {
        entities: { ...state.entities, programs: newPrograms },
      };
    });
  },

  updateProgram: (code, updates) => {
    set((state) => {
      const program = state.entities.programs.get(code);
      if (!program) return state;

      const updated = { ...program, ...updates };
      const newPrograms = new Map(state.entities.programs);
      newPrograms.set(code, updated);

      return {
        entities: { ...state.entities, programs: newPrograms },
      };
    });
  },

  deactivateProgram: (code) => {
    get().updateProgram(code, { is_active: false });
  },

  setProgramFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, programs: filters },
    }));
    get().fetchPrograms(filters);
  },
});
