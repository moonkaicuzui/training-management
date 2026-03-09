/**
 * Automation CRUD actions for ProjectStore
 */

import type { Automation } from '@/types/project';
import * as projectService from '@/services/projectService';
import type { StoreSet, StoreGet } from './types';

export const createAutomationActions = (set: StoreSet, get: StoreGet) => ({
  fetchAutomationsByProject: async (projectId: string) => {
    set({ isAutomationsLoading: true, error: null });
    try {
      const automations = await projectService.getAutomationsByProject(projectId);
      set({ automations, isAutomationsLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '자동화 규칙을 불러오는데 실패했습니다.',
        isAutomationsLoading: false,
      });
    }
  },

  createAutomation: async (data: Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'runCount' | 'lastRunAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const automation = await projectService.createAutomation(data);
      set((state) => ({
        automations: [...state.automations, automation],
        isLoading: false,
      }));
      return automation;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '자동화 규칙 생성에 실패했습니다.',
        isLoading: false,
      });
      throw error;
    }
  },

  updateAutomation: async (automationId: string, data: Partial<Automation>) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.updateAutomation(automationId, data);
      set((state) => ({
        automations: state.automations.map((a) =>
          a.id === automationId ? { ...a, ...data, updatedAt: new Date() } : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '자동화 규칙 수정에 실패했습니다.',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteAutomation: async (automationId: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.deleteAutomation(automationId);
      set((state) => ({
        automations: state.automations.filter((a) => a.id !== automationId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '자동화 규칙 삭제에 실패했습니다.',
        isLoading: false,
      });
      throw error;
    }
  },

  toggleAutomation: async (automationId: string) => {
    const automation = get().automations.find((a) => a.id === automationId);
    if (!automation) return;
    await get().updateAutomation(automationId, { isActive: !automation.isActive });
  },
});
