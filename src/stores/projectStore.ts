/**
 * 프로젝트 관리 시스템 Zustand 스토어
 *
 * 팀원, 프로젝트, 과제, 메시지 상태 관리
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type {
  ProjectMember,
  Project,
  Task,
  Message,
  Category,
  CalendarEvent,
  CreateMemberInput,
  UpdateMemberInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateMessageInput,
  ViewType,
  TaskStatus,
  TaskFilter,
  Automation,
  ProjectNotification,
} from '@/types/project';
import * as projectService from '@/services/projectService';
import { useAuthStore } from '@/stores/authStore';

// ============================================================
// Cache Configuration
// ============================================================

const CACHE_TTL_MS = 30_000; // 30초
const isCacheValid = (ts: number | null, len: number) =>
  ts !== null && len > 0 && Date.now() - ts < CACHE_TTL_MS;

// 캐시 타임스탬프 (스토어 외부 — persist 대상 아님)
let _membersLastFetched: number | null = null;
let _projectsLastFetched: number | null = null;
let _tasksLastFetched: number | null = null;
let _categoriesLastFetched: number | null = null;
let _eventsLastFetched: number | null = null;
let _eventsLastRange: { start: number; end: number } | null = null;

// ============================================================
// Store Types
// ============================================================

interface ProjectStore {
  // State
  members: ProjectMember[];
  projects: Project[];
  tasks: Task[];
  messages: Message[];
  categories: Category[];
  events: CalendarEvent[];
  automations: Automation[];

  // Notification state
  notifications: ProjectNotification[];
  unreadNotificationCount: number;

  // Member-Auth linking
  currentUserMember: ProjectMember | null;

  // Current selections
  currentProjectId: string | null;
  currentTaskId: string | null;
  currentMemberId: string | null;

  // View settings
  currentView: ViewType;
  filters: TaskFilter[];

  // Loading states
  isLoading: boolean;
  isMembersLoading: boolean;
  isProjectsLoading: boolean;
  isTasksLoading: boolean;
  isMessagesLoading: boolean;
  isAutomationsLoading: boolean;

  // Error state
  error: string | null;

  // Subscription cleanup functions
  unsubscribeFunctions: (() => void)[];
  tasksUnsubscribe: (() => void) | null;
  messagesUnsubscribe: (() => void) | null;
  notificationsUnsubscribe: (() => void) | null;

  // Member Actions
  fetchMembers: () => Promise<void>;
  createMember: (input: CreateMemberInput) => Promise<ProjectMember>;
  updateMember: (memberId: string, input: UpdateMemberInput) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  subscribeMembersRealtime: () => void;

  // Project Actions
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description: string, members?: string[]) => Promise<Project>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  selectProject: (projectId: string | null) => void;
  subscribeProjectsRealtime: () => void;

  // Task Actions
  fetchAllTasks: () => Promise<void>;
  fetchTasksByProject: (projectId: string) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (taskId: string, input: UpdateTaskInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  selectTask: (taskId: string | null) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  batchUpdateTaskStatus: (taskIds: string[], status: TaskStatus) => Promise<void>;
  subscribeTasksRealtime: (projectId: string) => void;

  // Message Actions
  fetchMessagesByTask: (taskId: string) => Promise<void>;
  createMessage: (input: CreateMessageInput) => Promise<Message>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  resolveMessage: (messageId: string) => Promise<void>;
  subscribeMessagesRealtime: (taskId: string) => void;

  // Category Actions
  fetchCategories: () => Promise<void>;
  createCategory: (name: string, color: string, type: 'event' | 'task', icon?: string) => Promise<Category>;
  updateCategory: (categoryId: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Event Actions
  fetchEvents: (startDate: Date, endDate: Date) => Promise<void>;
  fetchEventsByDateRange: (startDate: Date, endDate: Date) => Promise<void>;
  createEvent: (data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, data: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;

  // Automation Actions
  fetchAutomationsByProject: (projectId: string) => Promise<void>;
  createAutomation: (data: Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'runCount' | 'lastRunAt'>) => Promise<Automation>;
  updateAutomation: (automationId: string, data: Partial<Automation>) => Promise<void>;
  deleteAutomation: (automationId: string) => Promise<void>;
  toggleAutomation: (automationId: string) => Promise<void>;

  // Notification Actions
  fetchNotifications: () => Promise<void>;
  subscribeNotificationsRealtime: () => void;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  createNotification: (data: Omit<ProjectNotification, 'id' | 'createdAt'>) => Promise<void>;

  // Member-Auth Linking Actions
  linkCurrentUser: () => Promise<void>;
  fetchMyTasks: () => Task[];

  // View Actions
  setCurrentView: (view: ViewType) => void;
  setFilters: (filters: TaskFilter[]) => void;
  clearFilters: () => void;

  // Utility Actions
  getMemberById: (memberId: string) => ProjectMember | undefined;
  getTaskById: (taskId: string) => Task | undefined;
  getProjectById: (projectId: string) => Project | undefined;
  getCurrentProject: () => Project | null;
  getCurrentTask: () => Task | null;
  getTasksByStatus: (status: TaskStatus) => Task[];
  getAssignedTasks: (memberId: string) => Task[];
  getUnreadMessagesCount: () => number;

  // Cleanup
  cleanup: () => void;
  clearError: () => void;
}

// ============================================================
// Store Implementation
// ============================================================

// 현재 사용자 ID 가져오기
const getCurrentUserId = (): string => {
  const user = useAuthStore.getState().user;
  return user?.id || 'unknown';
};

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
        // Member Actions
        // ============================================================

        fetchMembers: async () => {
          if (isCacheValid(_membersLastFetched, get().members.length)) return;
          set({ isMembersLoading: true, error: null });
          try {
            const members = await projectService.getMembers();
            _membersLastFetched = Date.now();
            set({ members, isMembersLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '팀원 목록을 불러오는데 실패했습니다.',
              isMembersLoading: false,
            });
          }
        },

        createMember: async (input: CreateMemberInput) => {
          set({ isLoading: true, error: null });
          try {
            const member = await projectService.createMember(input);
            set((state) => ({
              members: [...state.members, member],
              isLoading: false,
            }));
            return member;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '팀원 생성에 실패했습니다.',
              isLoading: false,
            });
            throw error;
          }
        },

        updateMember: async (memberId: string, input: UpdateMemberInput) => {
          set({ isLoading: true, error: null });
          try {
            await projectService.updateMember(memberId, input);
            set((state) => ({
              members: state.members.map((m) =>
                m.id === memberId ? { ...m, ...input, updatedAt: new Date() } : m
              ),
              isLoading: false,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '팀원 수정에 실패했습니다.',
              isLoading: false,
            });
            throw error;
          }
        },

        deleteMember: async (memberId: string) => {
          set({ isLoading: true, error: null });
          try {
            await projectService.deactivateMember(memberId);
            set((state) => ({
              members: state.members.map((m) =>
                m.id === memberId ? { ...m, status: 'inactive' } : m
              ),
              isLoading: false,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '팀원 삭제에 실패했습니다.',
              isLoading: false,
            });
            throw error;
          }
        },

        subscribeMembersRealtime: () => {
          const unsubscribe = projectService.subscribeMembersRealtime((members) => {
            set({ members });
          });
          set((state) => ({
            unsubscribeFunctions: [...state.unsubscribeFunctions, unsubscribe],
          }));
        },

        // ============================================================
        // Project Actions
        // ============================================================

        fetchProjects: async () => {
          if (isCacheValid(_projectsLastFetched, get().projects.length)) return;
          set({ isProjectsLoading: true, error: null });
          try {
            const projects = await projectService.getProjects();
            _projectsLastFetched = Date.now();
            set({ projects, isProjectsLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '프로젝트 목록을 불러오는데 실패했습니다.',
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
              error: error instanceof Error ? error.message : '프로젝트 생성에 실패했습니다.',
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
              error: error instanceof Error ? error.message : '프로젝트 수정에 실패했습니다.',
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

        // ============================================================
        // Task Actions
        // ============================================================

        fetchAllTasks: async () => {
          if (isCacheValid(_tasksLastFetched, get().tasks.length)) return;
          set({ isTasksLoading: true, error: null });
          try {
            const tasks = await projectService.getAllTasks();
            _tasksLastFetched = Date.now();
            set({ tasks, isTasksLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '과제 목록을 불러오는데 실패했습니다.',
              isTasksLoading: false,
            });
          }
        },

        fetchTasksByProject: async (projectId: string) => {
          _tasksLastFetched = null; // 전체 과제 캐시 무효화
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

        // ============================================================
        // Message Actions
        // ============================================================

        fetchMessagesByTask: async (taskId: string) => {
          set({ isMessagesLoading: true, error: null });
          try {
            const messages = await projectService.getMessagesByTask(taskId);
            set({ messages, isMessagesLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '메시지 목록을 불러오는데 실패했습니다.',
              isMessagesLoading: false,
            });
          }
        },

        createMessage: async (input: CreateMessageInput) => {
          set({ isLoading: true, error: null });
          try {
            const senderId = getCurrentUserId();
            const message = await projectService.createMessage(input, senderId);
            set((state) => ({
              messages: [...state.messages, message],
              isLoading: false,
            }));
            return message;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '메시지 생성에 실패했습니다.',
              isLoading: false,
            });
            throw error;
          }
        },

        markMessageAsRead: async (messageId: string) => {
          try {
            const userId = getCurrentUserId();
            await projectService.markMessageAsRead(messageId, userId);
            set((state) => ({
              messages: state.messages.map((m) =>
                m.id === messageId
                  ? { ...m, readBy: { ...m.readBy, [userId]: new Date() } }
                  : m
              ),
            }));
          } catch (error) {
            console.error('Failed to mark message as read:', error);
          }
        },

        resolveMessage: async (messageId: string) => {
          set({ isLoading: true, error: null });
          try {
            const resolvedBy = getCurrentUserId();
            await projectService.resolveMessage(messageId, resolvedBy);
            set((state) => ({
              messages: state.messages.map((m) =>
                m.id === messageId
                  ? { ...m, isResolved: true, resolvedAt: new Date(), resolvedBy }
                  : m
              ),
              isLoading: false,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '메시지 해결에 실패했습니다.',
              isLoading: false,
            });
            throw error;
          }
        },

        subscribeMessagesRealtime: (taskId: string) => {
          // Unsubscribe existing messages listener if any
          const { messagesUnsubscribe } = get();
          if (messagesUnsubscribe) messagesUnsubscribe();

          const unsubscribe = projectService.subscribeMessagesRealtime(taskId, (messages) => {
            set({ messages });
          });
          set({ messagesUnsubscribe: unsubscribe });
        },

        // ============================================================
        // Category Actions
        // ============================================================

        fetchCategories: async () => {
          if (isCacheValid(_categoriesLastFetched, get().categories.length)) return;
          set({ isLoading: true, error: null });
          try {
            const categories = await projectService.getCategories();
            _categoriesLastFetched = Date.now();
            set({ categories, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '카테고리 목록을 불러오는데 실패했습니다.',
              isLoading: false,
            });
          }
        },

        createCategory: async (name: string, color: string, type: 'event' | 'task', icon?: string) => {
          set({ isLoading: true, error: null });
          try {
            const category = await projectService.createCategory(name, color, type, icon);
            set((state) => ({
              categories: [...state.categories, category],
              isLoading: false,
            }));
            return category;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '카테고리 생성에 실패했습니다.',
              isLoading: false,
            });
            throw error;
          }
        },

        updateCategory: async (categoryId: string, data: Partial<Category>) => {
          set({ isLoading: true, error: null });
          try {
            await projectService.updateCategory(categoryId, data);
            set((state) => ({
              categories: state.categories.map((c) =>
                c.id === categoryId ? { ...c, ...data, updatedAt: new Date() } : c
              ),
              isLoading: false,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '카테고리 수정에 실패했습니다.',
              isLoading: false,
            });
            throw error;
          }
        },

        deleteCategory: async (categoryId: string) => {
          set({ isLoading: true, error: null });
          try {
            await projectService.deleteCategory(categoryId);
            set((state) => ({
              categories: state.categories.filter((c) => c.id !== categoryId),
              isLoading: false,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '카테고리 삭제에 실패했습니다.',
              isLoading: false,
            });
            throw error;
          }
        },

        // ============================================================
        // Event Actions
        // ============================================================

        fetchEvents: async (startDate: Date, endDate: Date) => {
          const rangeStart = startDate.getTime();
          const rangeEnd = endDate.getTime();
          if (
            isCacheValid(_eventsLastFetched, get().events.length) &&
            _eventsLastRange &&
            _eventsLastRange.start === rangeStart &&
            _eventsLastRange.end === rangeEnd
          ) return;
          set({ isLoading: true, error: null });
          try {
            const events = await projectService.getEventsByDateRange(startDate, endDate);
            _eventsLastFetched = Date.now();
            _eventsLastRange = { start: rangeStart, end: rangeEnd };
            set({ events, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '일정 목록을 불러오는데 실패했습니다.',
              isLoading: false,
            });
          }
        },

        fetchEventsByDateRange: async (startDate: Date, endDate: Date) => {
          set({ isLoading: true, error: null });
          try {
            const events = await projectService.getEventsByDateRange(startDate, endDate);
            set({ events, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '일정 목록을 불러오는데 실패했습니다.',
              isLoading: false,
            });
          }
        },

        createEvent: async (data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
          set({ isLoading: true, error: null });
          try {
            const event = await projectService.createEvent(data);
            set((state) => ({
              events: [...state.events, event],
              isLoading: false,
            }));
            return event;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '일정 생성에 실패했습니다.',
              isLoading: false,
            });
            throw error;
          }
        },

        updateEvent: async (eventId: string, data: Partial<CalendarEvent>) => {
          set({ isLoading: true, error: null });
          try {
            await projectService.updateEvent(eventId, data);
            set((state) => ({
              events: state.events.map((e) =>
                e.id === eventId ? { ...e, ...data, updatedAt: new Date() } : e
              ),
              isLoading: false,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '일정 수정에 실패했습니다.',
              isLoading: false,
            });
            throw error;
          }
        },

        deleteEvent: async (eventId: string) => {
          set({ isLoading: true, error: null });
          try {
            await projectService.deleteEvent(eventId);
            set((state) => ({
              events: state.events.filter((e) => e.id !== eventId),
              isLoading: false,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '일정 삭제에 실패했습니다.',
              isLoading: false,
            });
            throw error;
          }
        },

        // ============================================================
        // Automation Actions
        // ============================================================

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

        createAutomation: async (data) => {
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

        // ============================================================
        // Notification Actions
        // ============================================================

        fetchNotifications: async () => {
          try {
            const userId = getCurrentUserId();
            if (userId === 'unknown') return;
            const notifications = await projectService.getNotificationsByUser(userId);
            const unreadCount = notifications.filter((n) => !n.isRead).length;
            set({ notifications, unreadNotificationCount: unreadCount });
          } catch (error) {
            console.error('Failed to fetch notifications:', error);
          }
        },

        subscribeNotificationsRealtime: () => {
          const { notificationsUnsubscribe } = get();
          if (notificationsUnsubscribe) notificationsUnsubscribe();

          const userId = getCurrentUserId();
          if (userId === 'unknown') return;

          const unsubscribe = projectService.subscribeNotificationsRealtime(userId, (notifications) => {
            const unreadCount = notifications.filter((n) => !n.isRead).length;
            set({ notifications, unreadNotificationCount: unreadCount });
          });
          set({ notificationsUnsubscribe: unsubscribe });
        },

        markNotificationRead: async (notificationId: string) => {
          try {
            await projectService.markNotificationAsRead(notificationId);
            set((state) => {
              const updated = state.notifications.map((n) =>
                n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
              );
              return {
                notifications: updated,
                unreadNotificationCount: updated.filter((n) => !n.isRead).length,
              };
            });
          } catch (error) {
            console.error('Failed to mark notification as read:', error);
          }
        },

        markAllNotificationsRead: async () => {
          try {
            const userId = getCurrentUserId();
            await projectService.markAllNotificationsAsRead(userId);
            set((state) => ({
              notifications: state.notifications.map((n) => ({ ...n, isRead: true, readAt: new Date() })),
              unreadNotificationCount: 0,
            }));
          } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
          }
        },

        createNotification: async (data) => {
          try {
            await projectService.createNotification(data);
          } catch (error) {
            console.error('Failed to create notification:', error);
          }
        },

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
            console.error('Failed to link current user:', error);
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

        setCurrentView: (view: ViewType) => {
          set({ currentView: view });
        },

        setFilters: (filters: TaskFilter[]) => {
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
          _membersLastFetched = null;
          _projectsLastFetched = null;
          _tasksLastFetched = null;
          _categoriesLastFetched = null;
          _eventsLastFetched = null;
          _eventsLastRange = null;
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
