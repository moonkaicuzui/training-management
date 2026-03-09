/**
 * 자동화 워크플로우 관련 상수 및 유틸리티
 */

import React from 'react';
import {
  RefreshCw,
  UserPlus,
  Clock,
  Plus,
  Target,
  CalendarPlus,
  Bell,
  Mail,
  MessageSquare,
  Zap,
} from 'lucide-react';
import type { TriggerType, ActionType, TaskStatus } from '@/types/project';

// 트리거 타입 정의
export interface TriggerOption {
  value: TriggerType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export const TRIGGER_OPTIONS: TriggerOption[] = [
  {
    value: 'task_status_changed',
    label: 'projects.automation.triggerStatusChanged',
    icon: React.createElement(RefreshCw, { className: 'h-4 w-4' }),
    description: 'projects.automation.triggerStatusChangedDesc'
  },
  {
    value: 'task_assignee_changed',
    label: 'projects.automation.triggerAssigneeChanged',
    icon: React.createElement(UserPlus, { className: 'h-4 w-4' }),
    description: 'projects.automation.triggerAssigneeChangedDesc'
  },
  {
    value: 'task_due_date',
    label: 'projects.automation.triggerDueDate',
    icon: React.createElement(Clock, { className: 'h-4 w-4' }),
    description: 'projects.automation.triggerDueDateDesc'
  },
  {
    value: 'task_created',
    label: 'projects.automation.triggerTaskCreated',
    icon: React.createElement(Plus, { className: 'h-4 w-4' }),
    description: 'projects.automation.triggerTaskCreatedDesc'
  },
  {
    value: 'task_progress_changed',
    label: 'projects.automation.triggerProgressChanged',
    icon: React.createElement(Target, { className: 'h-4 w-4' }),
    description: 'projects.automation.triggerProgressChangedDesc'
  },
  {
    value: 'scheduled_time',
    label: 'projects.automation.triggerScheduledTime',
    icon: React.createElement(CalendarPlus, { className: 'h-4 w-4' }),
    description: 'projects.automation.triggerScheduledTimeDesc'
  },
];

// 액션 타입 정의
export interface ActionOption {
  value: ActionType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export const ACTION_OPTIONS: ActionOption[] = [
  {
    value: 'change_status',
    label: 'projects.automation.actionChangeStatus',
    icon: React.createElement(RefreshCw, { className: 'h-4 w-4' }),
    description: 'projects.automation.actionChangeStatusDesc'
  },
  {
    value: 'change_assignee',
    label: 'projects.automation.actionChangeAssignee',
    icon: React.createElement(UserPlus, { className: 'h-4 w-4' }),
    description: 'projects.automation.actionChangeAssigneeDesc'
  },
  {
    value: 'send_notification',
    label: 'projects.automation.actionSendNotification',
    icon: React.createElement(Bell, { className: 'h-4 w-4' }),
    description: 'projects.automation.actionSendNotificationDesc'
  },
  {
    value: 'send_email',
    label: 'projects.automation.actionSendEmail',
    icon: React.createElement(Mail, { className: 'h-4 w-4' }),
    description: 'projects.automation.actionSendEmailDesc'
  },
  {
    value: 'create_task',
    label: 'projects.automation.actionCreateTask',
    icon: React.createElement(CalendarPlus, { className: 'h-4 w-4' }),
    description: 'projects.automation.actionCreateTaskDesc'
  },
  {
    value: 'add_comment',
    label: 'projects.automation.actionAddComment',
    icon: React.createElement(MessageSquare, { className: 'h-4 w-4' }),
    description: 'projects.automation.actionAddCommentDesc'
  },
  {
    value: 'extend_due_date',
    label: 'projects.automation.actionExtendDueDate',
    icon: React.createElement(Clock, { className: 'h-4 w-4' }),
    description: 'projects.automation.actionExtendDueDateDesc'
  },
];

// 상태 라벨 (i18n keys)
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'projects.automation.statusTodo',
  in_progress: 'projects.automation.statusInProgress',
  delayed_start: 'projects.automation.statusDelayedStart',
  delayed_complete: 'projects.automation.statusDelayedComplete',
  review: 'projects.automation.statusReview',
  done: 'projects.automation.statusDone',
};

// 유틸리티 함수들
export const getTriggerIcon = (triggerType: TriggerType): React.ReactNode => {
  const trigger = TRIGGER_OPTIONS.find(t => t.value === triggerType);
  return trigger?.icon || React.createElement(Zap, { className: 'h-4 w-4' });
};

export const getActionIcon = (actionType: ActionType): React.ReactNode => {
  const action = ACTION_OPTIONS.find(a => a.value === actionType);
  return action?.icon || React.createElement(Zap, { className: 'h-4 w-4' });
};

export const getTriggerLabel = (triggerType: TriggerType): string => {
  const trigger = TRIGGER_OPTIONS.find(t => t.value === triggerType);
  return trigger?.label || triggerType;
};

export const getActionLabel = (actionType: ActionType): string => {
  const action = ACTION_OPTIONS.find(a => a.value === actionType);
  return action?.label || actionType;
};

// 자동화 폼 데이터 타입
export interface AutomationFormData {
  name: string;
  description: string;
  triggerType: TriggerType;
  triggerConditions: {
    fromStatus?: TaskStatus;
    toStatus?: TaskStatus;
    daysBefore?: number;
    progressThreshold?: number;
  };
  actions: {
    type: ActionType;
    params: {
      status?: TaskStatus;
      message?: string;
      daysToExtend?: number;
    };
  }[];
}

// 기본 폼 데이터
export const DEFAULT_AUTOMATION_FORM: AutomationFormData = {
  name: '',
  description: '',
  triggerType: 'task_status_changed',
  triggerConditions: {
    fromStatus: undefined,
    toStatus: undefined,
    daysBefore: 3,
    progressThreshold: 100,
  },
  actions: [],
};
