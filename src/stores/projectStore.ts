/**
 * 프로젝트 관리 시스템 Zustand 스토어
 *
 * 팀원, 프로젝트, 과제, 메시지 상태 관리
 * Action implementations are split into domain-specific slices under ./project/
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { TaskStatus } from '@/types/project';
import { useAuthStore } from '@/stores/authStore';
import * as projectService from '@/services/projectService';
import { logger } from '@/utils/logger';
import type { ProjectStore } from './project/types';
import {
  createMemberActions,
  createProjectActions,
  createTaskActions,
  createMessageActions,
  createCalendarActions,
  createAutomationActions,
  createNotificationActions,
  resetCache,
  getCurrentUserId,
} from './project';

// ============================================================
// Store Implementation
// ============================================================

export const useProjectStore = create<ProjectStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        members: [],
        projects: [],
        tasks: [],
        messages: [],
        categories: [],
        events: [],
        automations: [],

        // Notifications
        notifications: [],
        unreadNotificationCount: 0,

        // Member-Auth linking
        currentUserMember: null,

        currentProjectId: null,
        currentTaskId: null,
        currentMemberId: null,

        currentView: 'list',
        filters: [],

        isLoading: false,
        isMembersLoading: false,
        isProjectsLoading: false,
        isTasksLoading: false,
        isMessagesLoading: false,
        isAutomationsLoading: false,

        error: null,
        unsubscribeFunctions: [],
        tasksUnsubscribe: null,
        messagesUnsubscribe: null,
        notificationsUnsubscribe: null,

        // ============================================================
        // Spread all domain-specific actions
        // ============================================================

        ...createMemberActions(set, get),
        ...createProjectActions(set, get),
        ...createTaskActions(set, get),
        ...createMessageActions(set, get),
        ...createCalendarActions(set, get),
        ...createAutomationActions(set, get),
        ...createNotificationActions(set, get),

        // ============================================================
        // Member-Auth Linking Actions
        // ============================================================

        linkCurrentUser: async () => {
          try {
            const user = useAuthStore.getState().user;
            if (!user?.email) return;

            // 먼저 uid로 검색
            let member = await projectService.getMemberByUid(user.id);
            if (member) {
              set({ currentUserMember: member });
              return;
            }

            // 이메일로 검색 후 uid 연결
            member = await projectService.getMemberByEmail(user.email);
            if (member) {
              await projectService.linkMemberToAuth(member.id, user.id);
              set({
                currentUserMember: { ...member, uid: user.id },
                members: get().members.map((m) =>
                  m.id === member!.id ? { ...m, uid: user.id } : m
                ),
              });
            }
          } catch (error) {
            logger.error('[projectStore] linkCurrentUser failed:', error);
          }
        },

        fetchMyTasks: () => {
          const { currentUserMember, tasks } = get();
          if (!currentUserMember) return [];
          return tasks.filter((t) => t.assignees.includes(currentUserMember.id));
        },

        // ============================================================
        // View Actions
        // ============================================================

        setCurrentView: (view) => {
          set({ currentView: view });
        },

        setFilters: (filters) => {
          set({ filters });
        },

        clearFilters: () => {
          set({ filters: [] });
        },

        // ============================================================
        // Utility Getters
        // ============================================================

        getMemberById: (memberId: string) => {
          return get().members.find((m) => m.id === memberId);
        },

        getTaskById: (taskId: string) => {
          return get().tasks.find((t) => t.id === taskId);
        },

        getProjectById: (projectId: string) => {
          return get().projects.find((p) => p.id === projectId);
        },

        getCurrentProject: () => {
          const { currentProjectId, projects } = get();
          if (!currentProjectId) return null;
          return projects.find((p) => p.id === currentProjectId) || null;
        },

        getCurrentTask: () => {
          const { currentTaskId, tasks } = get();
          if (!currentTaskId) return null;
          return tasks.find((t) => t.id === currentTaskId) || null;
        },

        getTasksByStatus: (status: TaskStatus) => {
          return get().tasks.filter((t) => t.status === status);
        },

        getAssignedTasks: (memberId: string) => {
          return get().tasks.filter((t) => t.assignees.includes(memberId));
        },

        getUnreadMessagesCount: () => {
          const userId = getCurrentUserId();
          return get().messages.filter(
            (m) => m.senderId !== userId && !m.readBy[userId]
          ).length;
        },

        // ============================================================
        // Cleanup
        // ============================================================

        cleanup: () => {
          const { unsubscribeFunctions, tasksUnsubscribe, messagesUnsubscribe, notificationsUnsubscribe } = get();
          unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
          if (tasksUnsubscribe) tasksUnsubscribe();
          if (messagesUnsubscribe) messagesUnsubscribe();
          if (notificationsUnsubscribe) notificationsUnsubscribe();
          // 캐시 타임스탬프 리셋
          resetCache();
          set({
            unsubscribeFunctions: [],
            tasksUnsubscribe: null,
            messagesUnsubscribe: null,
            notificationsUnsubscribe: null,
            currentProjectId: null,
            currentTaskId: null,
            tasks: [],
            messages: [],
            notifications: [],
            unreadNotificationCount: 0,
            currentUserMember: null,
          });
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'project-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          currentProjectId: state.currentProjectId,
          currentView: state.currentView,
        }),
      }
    ),
    { name: 'ProjectStore' }
  )
);
