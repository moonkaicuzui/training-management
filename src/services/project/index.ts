/**
 * 프로젝트 관리 서비스 - 통합 re-export
 *
 * 기존 `import * as projectService from '@/services/projectService'` 패턴 유지를 위해
 * 모든 하위 서비스를 re-export합니다.
 */

// Common (COLLECTIONS 상수)
export { COLLECTIONS } from './common';

// Member Service
export {
  getMembers,
  getActiveMembers,
  getMember,
  createMember,
  updateMember,
  deactivateMember,
  deleteMember,
  subscribeMembersRealtime,
  calculateMemberStats,
  getMemberByEmail,
  getMemberByUid,
  linkMemberToAuth,
  getTasksByAssigneeUid,
} from './projectMemberService';

// Task & Project Service
export {
  getProjects,
  getProject,
  createProject,
  updateProject,
  subscribeProjectsRealtime,
  getTasksByProject,
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatusAuto,
  subscribeTasksRealtime,
  batchUpdateTaskStatus,
  batchAddProjectMembers,
  validateTaskDependencies,
  getBlockingTasks,
  subscribeToTasks,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getEventsByDateRange,
  createEvent,
  updateEvent,
  deleteEvent,
  getProjectSettings,
  updateProjectSettings,
} from './projectTaskService';

// Message & Notification Service
export {
  getMessagesByTask,
  createMessage,
  markMessageAsRead,
  resolveMessage,
  subscribeMessagesRealtime,
  getUnreadMessageCount,
  createNotification,
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeNotificationsRealtime,
} from './projectMessageService';

// Automation Service
export {
  getAutomationsByProject,
  createAutomation,
  updateAutomation,
  deleteAutomation,
} from './projectAutomationService';
