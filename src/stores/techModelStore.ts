/**
 * TECH / NEW MODEL Store
 *
 * Zustand store for Tech Model and Review Guideline management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import * as api from '@/services/api';
import { logger } from '@/utils/logger';
import type {
  TechModel,
  TechReviewGuideline,
  TechModelFilters,
} from '@/types/techModel';

// ========== Store Interface ==========

interface TechModelState {
  // Data
  models: TechModel[];
  guidelines: TechReviewGuideline[];

  // UI State
  isLoading: boolean;
  error: string | null;
  filters: TechModelFilters;

  // Model Actions
  fetchModels: (filters?: TechModelFilters) => Promise<void>;
  createModel: (data: Omit<TechModel, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TechModel>;
  updateModel: (id: string, data: Partial<Omit<TechModel, 'id' | 'createdAt' | 'createdBy'>>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;

  // Guideline Actions
  fetchGuidelines: (modelId?: string) => Promise<void>;
  createGuideline: (data: Omit<TechReviewGuideline, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TechReviewGuideline>;
  updateGuideline: (id: string, data: Partial<Omit<TechReviewGuideline, 'id' | 'createdAt' | 'createdBy'>>) => Promise<void>;
  deleteGuideline: (id: string) => Promise<void>;

  // UI Actions
  setFilters: (filters: TechModelFilters) => void;
  clearError: () => void;
}

// ========== Store Implementation ==========

export const useTechModelStore = create<TechModelState>()(
  devtools(
    immer((set) => ({
      // Initial State
      models: [],
      guidelines: [],
      isLoading: false,
      error: null,
      filters: {},

      // Model Actions
      fetchModels: async (filters) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const models = await api.techModel.getModels(filters);
          set((state) => {
            state.models = models;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[TechModelStore] fetchModels failed', error);
          set((state) => {
            state.error = '모델 데이터를 불러오는데 실패했습니다.';
            state.isLoading = false;
          });
        }
      },

      createModel: async (data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const model = await api.techModel.createModel(data);
          set((state) => {
            state.models.unshift(model);
            state.isLoading = false;
          });
          return model;
        } catch (error) {
          logger.error('[TechModelStore] createModel failed', error);
          set((state) => {
            state.error = '모델 등록에 실패했습니다.';
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateModel: async (id, data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          await api.techModel.updateModel(id, data);
          set((state) => {
            const idx = state.models.findIndex((m) => m.id === id);
            if (idx !== -1) {
              Object.assign(state.models[idx], data);
            }
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[TechModelStore] updateModel failed', error);
          set((state) => {
            state.error = '모델 수정에 실패했습니다.';
            state.isLoading = false;
          });
          throw error;
        }
      },

      deleteModel: async (id) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          await api.techModel.deleteModel(id);
          set((state) => {
            state.models = state.models.filter((m) => m.id !== id);
            // 해당 모델의 지침도 제거
            state.guidelines = state.guidelines.filter((g) => g.modelId !== id);
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[TechModelStore] deleteModel failed', error);
          set((state) => {
            state.error = '모델 삭제에 실패했습니다.';
            state.isLoading = false;
          });
          throw error;
        }
      },

      // Guideline Actions
      fetchGuidelines: async (modelId) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const guidelines = await api.techModel.getGuidelines(modelId);
          set((state) => {
            state.guidelines = guidelines;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[TechModelStore] fetchGuidelines failed', error);
          set((state) => {
            state.error = '리뷰지침 데이터를 불러오는데 실패했습니다.';
            state.isLoading = false;
          });
        }
      },

      createGuideline: async (data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const guideline = await api.techModel.createGuideline(data);
          set((state) => {
            state.guidelines.unshift(guideline);
            state.isLoading = false;
          });
          return guideline;
        } catch (error) {
          logger.error('[TechModelStore] createGuideline failed', error);
          set((state) => {
            state.error = '리뷰지침 등록에 실패했습니다.';
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateGuideline: async (id, data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          await api.techModel.updateGuideline(id, data);
          set((state) => {
            const idx = state.guidelines.findIndex((g) => g.id === id);
            if (idx !== -1) {
              Object.assign(state.guidelines[idx], data);
            }
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[TechModelStore] updateGuideline failed', error);
          set((state) => {
            state.error = '리뷰지침 수정에 실패했습니다.';
            state.isLoading = false;
          });
          throw error;
        }
      },

      deleteGuideline: async (id) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          await api.techModel.deleteGuideline(id);
          set((state) => {
            state.guidelines = state.guidelines.filter((g) => g.id !== id);
            state.isLoading = false;
          });
        } catch (error) {
          logger.error('[TechModelStore] deleteGuideline failed', error);
          set((state) => {
            state.error = '리뷰지침 삭제에 실패했습니다.';
            state.isLoading = false;
          });
          throw error;
        }
      },

      // UI Actions
      setFilters: (filters) => {
        set((state) => {
          state.filters = filters;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    { name: 'TechModelStore' }
  )
);
