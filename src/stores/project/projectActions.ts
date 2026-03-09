/**
 * Project CRUD actions for ProjectStore
 */

import type { Project } from '@/types/project';
import * as projectService from '@/services/projectService';
import type { StoreSet, StoreGet } from './types';
import { isCacheValid, cache } from './cacheConfig';
import { getCurrentUserId } from './helpers';
import i18n from '@/i18n';

export const createProjectActions = (set: StoreSet, get: StoreGet) => ({
  fetchProjects: async () => {
    if (isCacheValid(cache.projectsLastFetched, get().projects.length)) return;
    set({ isProjectsLoading: true, error: null });
    try {
      const projects = await projectService.getProjects();
      cache.projectsLastFetched = Date.now();
      set({ projects, isProjectsLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.fetchProjectsFailed'),
        isProjectsLoading: false,
      });
    }
  },

  createProject: async (name: string, description: string, members: string[] = []) => {
    set({ isLoading: true, error: null });
    try {
      const ownerId = getCurrentUserId();
      const project = await projectService.createProject(name, description, ownerId, members);
      set((state) => ({
        projects: [...state.projects, project],
        isLoading: false,
      }));
      return project;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.createProjectFailed'),
        isLoading: false,
      });
      throw error;
    }
  },

  updateProject: async (projectId: string, data: Partial<Project>) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.updateProject(projectId, data);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, ...data, updatedAt: new Date() } : p
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.updateProjectFailed'),
        isLoading: false,
      });
      throw error;
    }
  },

  selectProject: (projectId: string | null) => {
    // Unsubscribe existing tasks & messages listeners before creating new ones
    const { tasksUnsubscribe, messagesUnsubscribe } = get();
    if (tasksUnsubscribe) tasksUnsubscribe();
    if (messagesUnsubscribe) messagesUnsubscribe();
    set({ currentProjectId: projectId, currentTaskId: null, tasks: [], messages: [], tasksUnsubscribe: null, messagesUnsubscribe: null });
    if (projectId) {
      get().fetchTasksByProject(projectId);
      get().subscribeTasksRealtime(projectId);
    }
  },

  subscribeProjectsRealtime: () => {
    const unsubscribe = projectService.subscribeProjectsRealtime((projects) => {
      set({ projects });
    });
    set((state) => ({
      unsubscribeFunctions: [...state.unsubscribeFunctions, unsubscribe],
    }));
  },
});
