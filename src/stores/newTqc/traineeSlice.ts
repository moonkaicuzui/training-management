import type {
  NewTQCTraineeFilters,
  NewTQCTraineeInput,
  NewTQCTraineeUpdate,
  NewTQCColorBlindTestInput,
  NewTQCStageUpdate,
} from '@/types';
import * as api from '@/services/api';
import type { StoreSet, StoreGet } from './types';

export const createTraineeActions = (set: StoreSet, get: StoreGet) => ({
  fetchTrainees: async (filters?: NewTQCTraineeFilters) => {
    set(state => ({
      loading: { ...state.loading, trainees: true },
      error: null,
      traineeFilters: filters || state.traineeFilters,
    }));

    try {
      const trainees = await api.getNewTQCTrainees(filters || get().traineeFilters);
      set({ trainees, loading: { ...get().loading, trainees: false } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch trainees';
      set({
        error: message,
        loading: { ...get().loading, trainees: false },
      });
    }
  },

  fetchTraineeDetail: async (traineeId: string) => {
    set(state => ({
      loading: { ...state.loading, traineeDetail: true },
      error: null,
    }));

    try {
      const trainee = await api.getNewTQCTraineeWithDetails(traineeId);
      set({
        selectedTrainee: trainee,
        loading: { ...get().loading, traineeDetail: false },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch trainee detail';
      set({
        error: message,
        loading: { ...get().loading, traineeDetail: false },
      });
    }
  },

  setTraineeFilters: (filters: NewTQCTraineeFilters) => {
    set({ traineeFilters: filters });
  },

  createTrainee: async (input: NewTQCTraineeInput) => {
    set(state => ({
      loading: { ...state.loading, saving: true },
      error: null,
    }));

    try {
      const newTrainee = await api.createNewTQCTrainee(input);
      set(state => ({
        trainees: [newTrainee, ...state.trainees],
        loading: { ...state.loading, saving: false },
      }));
      return newTrainee;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create trainee';
      set({
        error: message,
        loading: { ...get().loading, saving: false },
      });
      throw error;
    }
  },

  updateTrainee: async (input: NewTQCTraineeUpdate) => {
    set(state => ({
      loading: { ...state.loading, saving: true },
      error: null,
    }));

    try {
      const updatedTrainee = await api.updateNewTQCTrainee(input);
      if (updatedTrainee) {
        set(state => ({
          trainees: state.trainees.map(t =>
            t.trainee_id === input.trainee_id ? updatedTrainee : t
          ),
          selectedTrainee:
            state.selectedTrainee?.trainee_id === input.trainee_id
              ? { ...state.selectedTrainee, ...updatedTrainee }
              : state.selectedTrainee,
          loading: { ...state.loading, saving: false },
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update trainee';
      set({
        error: message,
        loading: { ...get().loading, saving: false },
      });
      throw error;
    }
  },

  clearSelectedTrainee: () => {
    set({ selectedTrainee: null });
  },

  createColorBlindTest: async (input: NewTQCColorBlindTestInput) => {
    set(state => ({
      loading: { ...state.loading, saving: true },
      error: null,
    }));

    try {
      const newTest = await api.createNewTQCColorBlindTest(input);

      const state = get();
      if (state.selectedTrainee?.trainee_id === input.trainee_id) {
        set(state => ({
          selectedTrainee: state.selectedTrainee
            ? {
                ...state.selectedTrainee,
                color_blind_status: input.result,
                colorBlindTests: [newTest, ...state.selectedTrainee.colorBlindTests],
              }
            : null,
          loading: { ...state.loading, saving: false },
        }));
      }

      set(state => ({
        trainees: state.trainees.map(t =>
          t.trainee_id === input.trainee_id
            ? { ...t, color_blind_status: input.result }
            : t
        ),
        loading: { ...state.loading, saving: false },
      }));

      return newTest;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create color blind test';
      set({
        error: message,
        loading: { ...get().loading, saving: false },
      });
      throw error;
    }
  },

  updateTrainingStage: async (input: NewTQCStageUpdate) => {
    set(state => ({
      loading: { ...state.loading, saving: true },
      error: null,
    }));

    try {
      const updatedStage = await api.updateNewTQCTrainingStage(input);

      if (updatedStage) {
        const state = get();
        if (state.selectedTrainee) {
          const updatedStages = state.selectedTrainee.stages.map(s =>
            s.stage_id === input.stage_id ? updatedStage : s
          );

          const completedCount = updatedStages.filter(s => s.status === 'COMPLETED').length;
          const progress = Math.round((completedCount / updatedStages.length) * 100);

          set(state => ({
            selectedTrainee: state.selectedTrainee
              ? {
                  ...state.selectedTrainee,
                  stages: updatedStages,
                  progress_percentage: progress,
                  status: progress === 100 ? 'COMPLETED' : state.selectedTrainee.status,
                }
              : null,
            loading: { ...state.loading, saving: false },
          }));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update training stage';
      set({
        error: message,
        loading: { ...get().loading, saving: false },
      });
      throw error;
    }
  },
});
