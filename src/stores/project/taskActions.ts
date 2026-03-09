/**
 * Task CRUD + status actions for ProjectStore
 */

import type { CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/types/project';
import * as projectService from '@/services/projectService';
import type { StoreSet, StoreGet } from './types';
import { isCacheValid, cache } from './cacheConfig';
import { getCurrentUserId } from './helpers';

export const createTaskActions = (set: StoreSet, get: StoreGet) => ({
  fetchAllTasks: async () => {
    if (isCacheValid(cache.tasksLastFetched, get().tasks.length)) return;
    set({ isTasksLoading: true, error: null });
    try {
      const tasks = await projectService.getAllTasks();
      cache.tasksLastFetched = Date.now();
      set({ tasks, isTasksLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '과제 목록을 불러오는데 실패했습니다.',
        isTasksLoading: false,
      });
    }
  },

  fetchTasksByProject: async (projectId: string) => {
    cache.tasksLastFetched = null; // 전체 과제 캐시 무효화
    set({ isTasksLoading: true, error: null });
    try {
      const tasks = await projectService.getTasksByProject(projectId);
      set({ tasks, isTasksLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '과제 목록을 불러오는데 실패했습니다.',
        isTasksLoading: false,
      });
    }
  },

  createTask: async (input: CreateTaskInput) => {
    set({ isTasksLoading: true, error: null });
    try {
      const createdBy = getCurrentUserId();
      const task = await projectService.createTask(input, createdBy);
      set((state) => ({
        tasks: [task, ...state.tasks],
        isTasksLoading: false,
      }));
      return task;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '과제 생성에 실패했습니다.',
        isTasksLoading: false,
      });
      throw error;
    }
  },

  updateTask: async (taskId: string, input: UpdateTaskInput) => {
    set({ isTasksLoading: true, error: null });
    try {
      await projectService.updateTask(taskId, input);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, ...input, updatedAt: new Date() } : t
        ),
        isTasksLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '과제 수정에 실패했습니다.',
        isTasksLoading: false,
      });
      throw error;
    }
  },

  deleteTask: async (taskId: string) => {
    set({ isTasksLoading: true, error: null });
    try {
      await projectService.deleteTask(taskId);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
        currentTaskId: state.currentTaskId === taskId ? null : state.currentTaskId,
        isTasksLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '과제 삭제에 실패했습니다.',
        isTasksLoading: false,
      });
      throw error;
    }
  },

  selectTask: (taskId: string | null) => {
    // Unsubscribe existing messages listener before creating new one
    const { messagesUnsubscribe } = get();
    if (messagesUnsubscribe) messagesUnsubscribe();
    set({ currentTaskId: taskId, messages: [], messagesUnsubscribe: null });
    if (taskId) {
      get().fetchMessagesByTask(taskId);
      get().subscribeMessagesRealtime(taskId);
    }
  },

  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
    await get().updateTask(taskId, { status });
  },

  batchUpdateTaskStatus: async (taskIds: string[], status: TaskStatus) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.batchUpdateTaskStatus(taskIds, status);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          taskIds.includes(t.id) ? { ...t, status, updatedAt: new Date() } : t
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '과제 일괄 수정에 실패했습니다.',
        isLoading: false,
      });
      throw error;
    }
  },

  subscribeTasksRealtime: (projectId: string) => {
    // Unsubscribe existing tasks listener if any
    const { tasksUnsubscribe } = get();
    if (tasksUnsubscribe) tasksUnsubscribe();

    const unsubscribe = projectService.subscribeTasksRealtime(projectId, (tasks) => {
      set({ tasks });
    });
    set({ tasksUnsubscribe: unsubscribe });
  },
});
