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
    label: '상태 변경',
    icon: React.createElement(RefreshCw, { className: 'h-4 w-4' }),
    description: '과제 상태가 변경되었을 때'
  },
  {
    value: 'task_assignee_changed',
    label: '담당자 변경',
    icon: React.createElement(UserPlus, { className: 'h-4 w-4' }),
    description: '과제 담당자가 변경되었을 때'
  },
  {
    value: 'task_due_date',
    label: '마감일 도래',
    icon: React.createElement(Clock, { className: 'h-4 w-4' }),
    description: '과제 마감일이 다가왔을 때'
  },
  {
    value: 'task_created',
    label: '과제 생성',
    icon: React.createElement(Plus, { className: 'h-4 w-4' }),
    description: '새 과제가 생성되었을 때'
  },
  {
    value: 'task_progress_changed',
    label: '진행률 변경',
    icon: React.createElement(Target, { className: 'h-4 w-4' }),
    description: '과제 진행률이 변경되었을 때'
  },
  {
    value: 'scheduled_time',
    label: '예약 시간',
    icon: React.createElement(CalendarPlus, { className: 'h-4 w-4' }),
    description: '지정된 시간에 실행'
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
    label: '상태 변경',
    icon: React.createElement(RefreshCw, { className: 'h-4 w-4' }),
    description: '과제 상태를 변경합니다'
  },
  {
    value: 'change_assignee',
    label: '담당자 변경',
    icon: React.createElement(UserPlus, { className: 'h-4 w-4' }),
    description: '과제 담당자를 변경합니다'
  },
  {
    value: 'send_notification',
    label: '알림 전송',
    icon: React.createElement(Bell, { className: 'h-4 w-4' }),
    description: '인앱 알림을 전송합니다'
  },
  {
    value: 'send_email',
    label: '이메일 전송',
    icon: React.createElement(Mail, { className: 'h-4 w-4' }),
    description: '이메일을 전송합니다'
  },
  {
    value: 'create_task',
    label: '과제 생성',
    icon: React.createElement(CalendarPlus, { className: 'h-4 w-4' }),
    description: '새 과제를 자동 생성합니다'
  },
  {
    value: 'add_comment',
    label: '댓글 추가',
    icon: React.createElement(MessageSquare, { className: 'h-4 w-4' }),
    description: '자동 댓글을 추가합니다'
  },
  {
    value: 'extend_due_date',
    label: '마감일 연장',
    icon: React.createElement(Clock, { className: 'h-4 w-4' }),
    description: '마감일을 연장합니다'
  },
];

// 상태 라벨
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '예정',
  in_progress: '진행중',
  delayed_start: '시작지연',
  delayed_complete: '완료지연',
  review: '검토중',
  done: '완료',
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
