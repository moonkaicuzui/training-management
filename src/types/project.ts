/**
 * 품질 부서 협업 프로젝트 관리 시스템 타입 정의
 *
 * Asana, Monday.com, Notion, Slack 스타일의 핵심 기능 통합
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================
// 기본 타입
// ============================================================

export type ProjectId = string;
export type TaskId = string;
export type MemberId = string;
export type MessageId = string;
export type CategoryId = string;
export type EventId = string;
export type AutomationId = string;

// ============================================================
// 사용자/팀원 관련 타입
// ============================================================

/** 팀원 상태 */
export type MemberStatus = 'active' | 'inactive';

/** 팀원 권한 레벨 */
export type MemberRole = 'admin' | 'member' | 'guest';

/** 팀원 정보 */
export interface ProjectMember {
  id: MemberId;
  name: string;
  email: string;
  role: MemberRole;
  department: string;
  position: string;
  photoURL?: string;
  status: MemberStatus;
  phone?: string;

  // 통계 정보 (계산된 값)
  stats?: MemberStats;

  // 타임스탬프
  lastActive?: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/** 팀원 통계 */
export interface MemberStats {
  assignedTasks: number;
  completedTasks: number;
  completionRate: number;
  averageResponseTime: number; // 시간 단위
  communicationScore: number; // 0-100
}

/** 팀원 생성 입력 */
export interface CreateMemberInput {
  name: string;
  email: string;
  role: MemberRole;
  department: string;
  position: string;
  phone?: string;
  photoURL?: string;
}

/** 팀원 수정 입력 */
export interface UpdateMemberInput extends Partial<CreateMemberInput> {
  status?: MemberStatus;
}

// ============================================================
// 프로젝트 관련 타입
// ============================================================

/** 프로젝트 상태 */
export type ProjectStatus = 'active' | 'archived' | 'completed';

/** 프로젝트 정보 */
export interface Project {
  id: ProjectId;
  name: string;
  description: string;
  ownerId: MemberId;
  members: MemberId[];
  status: ProjectStatus;
  color?: string;
  icon?: string;

  // 타임스탬프
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// ============================================================
// 과제(Task) 관련 타입
// ============================================================

/** 과제 상태 */
export type TaskStatus =
  | 'todo'           // 예정
  | 'in_progress'    // 진행중
  | 'delayed_start'  // 시작지연
  | 'delayed_complete' // 완료지연
  | 'review'         // 검토중
  | 'done';          // 완료

/** 과제 우선순위 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/** 과제 정보 */
export interface Task {
  id: TaskId;
  projectId: ProjectId;
  title: string;
  description: string;

  // 담당 및 할당
  assignees: MemberId[];
  createdBy: MemberId;

  // 일정
  startDate?: Timestamp | Date;
  dueDate?: Timestamp | Date;
  completedAt?: Timestamp | Date;

  // 상태 및 진행률
  status: TaskStatus;
  priority: TaskPriority;
  progress: number; // 0-100

  // 의존성
  dependencies: TaskId[]; // 이 과제가 의존하는 선행 과제들
  blockedBy?: TaskId[];   // 이 과제를 차단하는 과제들

  // 분류
  category?: string;
  tags?: string[];
  section?: string; // List View용 섹션

  // 첨부파일
  attachments?: TaskAttachment[];

  // 커스텀 필드
  customFields?: Record<string, unknown>;

  // 서브태스크
  parentTaskId?: TaskId;
  subtaskIds?: TaskId[];

  // 타임스탬프
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/** 첨부파일 정보 */
export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: MemberId;
  uploadedAt: Timestamp | Date;
}

/** 과제 생성 입력 */
export interface CreateTaskInput {
  projectId: ProjectId;
  title: string;
  description?: string;
  assignees?: MemberId[];
  startDate?: Date;
  dueDate?: Date;
  priority?: TaskPriority;
  dependencies?: TaskId[];
  category?: string;
  tags?: string[];
  section?: string;
  parentTaskId?: TaskId;
}

/** 과제 수정 입력 */
export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus;
  progress?: number;
}

// ============================================================
// 메시지/댓글 관련 타입
// ============================================================

/** 메시지 타입 */
export type MessageType = 'question' | 'request' | 'approval' | 'rejection' | 'info' | 'comment';

/** 읽음 상태 */
export interface ReadStatus {
  [userId: string]: Timestamp | Date | null;
}

/** 메시지 정보 */
export interface Message {
  id: MessageId;
  taskId: TaskId;
  senderId: MemberId;
  content: string;
  type: MessageType;

  // 스레드 (Slack 스타일)
  threadId?: MessageId; // 부모 메시지 ID (답글인 경우)
  replyCount?: number;

  // 멘션
  mentions?: MemberId[];

  // 읽음 확인 (Slack 스타일)
  readBy: ReadStatus;

  // 첨부파일
  attachments?: MessageAttachment[];

  // 인라인 댓글 위치 (Notion 스타일)
  blockId?: string;
  startOffset?: number;
  endOffset?: number;

  // 해결 상태 (Notion 스타일)
  isResolved?: boolean;
  resolvedAt?: Timestamp | Date;
  resolvedBy?: MemberId;

  // 타임스탬프
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/** 메시지 첨부파일 */
export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

/** 메시지 생성 입력 */
export interface CreateMessageInput {
  taskId: TaskId;
  content: string;
  type?: MessageType;
  threadId?: MessageId;
  mentions?: MemberId[];
  attachments?: MessageAttachment[];
  blockId?: string;
}

// ============================================================
// 캘린더/이벤트 관련 타입
// ============================================================

/** 카테고리 타입 */
export type CategoryType = 'event' | 'task';

/** 카테고리 정보 */
export interface Category {
  id: CategoryId;
  name: string;
  color: string;
  icon?: string;
  type: CategoryType;
  order: number;
  isActive: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/** 반복 타입 */
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

/** 반복 설정 */
export interface Recurrence {
  type: RecurrenceType;
  interval: number; // 간격 (예: 2주마다 = weekly, interval: 2)
  endDate?: Timestamp | Date;
  endCount?: number;
  daysOfWeek?: number[]; // 0-6 (일-토)
  dayOfMonth?: number;
}

/** 이벤트 정보 */
export interface CalendarEvent {
  id: EventId;
  title: string;
  description?: string;

  // 일정
  startDate: Timestamp | Date;
  endDate: Timestamp | Date;
  allDay: boolean;

  // 분류
  categoryId: CategoryId;

  // 장소 및 참석자
  location?: string;
  attendees: MemberId[];

  // 반복
  recurrence?: Recurrence;

  // 알림
  reminders?: EventReminder[];

  // 관련 과제
  linkedTaskId?: TaskId;

  // 타임스탬프
  createdBy: MemberId;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/** 이벤트 알림 */
export interface EventReminder {
  type: 'email' | 'push' | 'in_app';
  minutes: number; // 이벤트 시작 N분 전
}

// ============================================================
// 자동화 워크플로우 관련 타입 (Monday.com 스타일)
// ============================================================

/** 트리거 타입 */
export type TriggerType =
  | 'task_status_changed'
  | 'task_assignee_changed'
  | 'task_due_date'
  | 'task_created'
  | 'task_progress_changed'
  | 'scheduled_time'
  | 'custom_field_changed';

/** 조건 연산자 */
export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';

/** 자동화 조건 */
export interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

/** 액션 타입 */
export type ActionType =
  | 'change_status'
  | 'change_assignee'
  | 'send_notification'
  | 'send_email'
  | 'create_task'
  | 'update_field'
  | 'add_comment'
  | 'extend_due_date';

/** 자동화 액션 */
export interface AutomationAction {
  type: ActionType;
  params: Record<string, unknown>;
}

/** 자동화 트리거 */
export interface AutomationTrigger {
  type: TriggerType;
  conditions?: AutomationCondition[];
  schedule?: {
    cronExpression?: string;
    time?: string; // HH:mm
    daysOfWeek?: number[];
    daysBefore?: number; // 마감일 N일 전
  };
}

/** 자동화 규칙 */
export interface Automation {
  id: AutomationId;
  projectId: ProjectId;
  name: string;
  description?: string;
  isActive: boolean;

  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];

  // 실행 이력
  lastRunAt?: Timestamp | Date;
  runCount?: number;

  // 타임스탬프
  createdBy: MemberId;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// ============================================================
// 알림 관련 타입
// ============================================================

/** 알림 타입 */
export type NotificationType =
  | 'task_assigned'
  | 'task_due_soon'
  | 'task_overdue'
  | 'comment_mention'
  | 'comment_reply'
  | 'task_status_changed'
  | 'dependency_completed'
  | 'automation_executed';

/** 알림 정보 */
export interface ProjectNotification {
  id: string;
  userId: MemberId;
  type: NotificationType;
  title: string;
  message: string;

  // 관련 엔티티
  projectId?: ProjectId;
  taskId?: TaskId;
  messageId?: MessageId;

  // 상태
  isRead: boolean;
  readAt?: Timestamp | Date;

  // 타임스탬프
  createdAt: Timestamp | Date;
}

// ============================================================
// 뷰 관련 타입 (Asana 스타일)
// ============================================================

/** 뷰 타입 */
export type ViewType = 'list' | 'board' | 'timeline' | 'calendar';

/** 뷰 설정 */
export interface ViewSettings {
  type: ViewType;
  filters?: TaskFilter[];
  sortBy?: TaskSortOption;
  groupBy?: TaskGroupOption;
  columns?: string[]; // Board View 컬럼
}

/** 과제 필터 */
export interface TaskFilter {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

/** 과제 정렬 옵션 */
export interface TaskSortOption {
  field: string;
  direction: 'asc' | 'desc';
}

/** 과제 그룹 옵션 */
export type TaskGroupOption = 'status' | 'priority' | 'assignee' | 'section' | 'category' | 'none';

// ============================================================
// 대시보드 관련 타입
// ============================================================

/** 대시보드 위젯 타입 */
export type WidgetType =
  | 'task_status_chart'
  | 'urgent_tasks'
  | 'team_performance'
  | 'weekly_progress'
  | 'activity_timeline'
  | 'communication_matrix';

/** 대시보드 위젯 */
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config?: Record<string, unknown>;
}

// ============================================================
// 유틸리티 타입
// ============================================================

/** 페이지네이션 */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** API 응답 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: Pagination;
}

// ============================================================
// 상수
// ============================================================

/** 상태별 색상 */
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#6B7280',         // Gray
  in_progress: '#3B82F6',  // Blue
  delayed_start: '#F59E0B', // Amber
  delayed_complete: '#EF4444', // Red
  review: '#8B5CF6',       // Purple
  done: '#10B981',         // Green
};

/** 우선순위별 색상 */
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#6B7280',      // Gray
  medium: '#3B82F6',   // Blue
  high: '#F59E0B',     // Amber
  urgent: '#EF4444',   // Red
};

/** 메시지 타입별 아이콘 */
export const MESSAGE_TYPE_ICONS: Record<MessageType, string> = {
  question: '🤔',
  request: '📋',
  approval: '✅',
  rejection: '❌',
  info: 'ℹ️',
  comment: '💬',
};

/** 기본 카테고리 색상 팔레트 */
export const CATEGORY_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
];

/** 권한별 기능 */
export const MEMBER_ROLE_PERMISSIONS: Record<MemberRole, {
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canManageMembers: boolean;
  canCreateTask: boolean;
  canEditAnyTask: boolean;
  canDeleteTask: boolean;
  canManageAutomation: boolean;
}> = {
  admin: {
    canCreateProject: true,
    canEditProject: true,
    canDeleteProject: true,
    canManageMembers: true,
    canCreateTask: true,
    canEditAnyTask: true,
    canDeleteTask: true,
    canManageAutomation: true,
  },
  member: {
    canCreateProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canManageMembers: false,
    canCreateTask: true,
    canEditAnyTask: false,
    canDeleteTask: false,
    canManageAutomation: false,
  },
  guest: {
    canCreateProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canManageMembers: false,
    canCreateTask: false,
    canEditAnyTask: false,
    canDeleteTask: false,
    canManageAutomation: false,
  },
};
