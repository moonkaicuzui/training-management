/**
 * ProjectStore interface type definition
 *
 * Extracted from projectStore.ts for modular composition.
 */

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

export interface ProjectStore {
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

/** Zustand set/get helpers for slice functions */
export type StoreSet = (
  partial: Partial<ProjectStore> | ((state: ProjectStore) => Partial<ProjectStore>),
) => void;

export type StoreGet = () => ProjectStore;
