/**
 * Shared types for Project Calendar components
 */

import type { CalendarEvent, Task, RecurrenceType } from '@/types/project';
import type { TrainingSession } from '@/types';

// 캘린더 이벤트 타입
export interface CalendarEventItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: CalendarEvent;
  taskResource?: Task;
  sessionResource?: TrainingSession;
  type: 'event' | 'task' | 'session';
  color?: string;
  categoryId?: string;
}

// 카테고리 타입 (projectStore의 category)
export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
  type: 'event' | 'task';
}

// 새 이벤트 폼 타입
export interface EventFormData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  categoryId: string;
  location: string;
  url: string;
  recurrenceType: RecurrenceType | 'none';
  recurrenceInterval: number;
  recurrenceEndType: 'never' | 'onDate' | 'afterCount';
  recurrenceEndDate: Date;
  recurrenceEndCount: number;
  reminderMinutes: number | null;
}

// 교육 세션 상태별 색상
export const SESSION_STATUS_COLORS: Record<string, string> = {
  PLANNED: '#F59E0B',
  COMPLETED: '#10B981',
  CANCELLED: '#6B7280',
};

// 알림 프리셋 (분 단위)
export const REMINDER_PRESETS = [
  { value: '0', labelKey: 'projects.calendar.atTime' },
  { value: '5', labelKey: 'projects.calendar.minutesBefore', n: 5 },
  { value: '10', labelKey: 'projects.calendar.minutesBefore', n: 10 },
  { value: '15', labelKey: 'projects.calendar.minutesBefore', n: 15 },
  { value: '30', labelKey: 'projects.calendar.minutesBefore', n: 30 },
  { value: '60', labelKey: 'projects.calendar.hoursBefore', n: 1 },
  { value: '120', labelKey: 'projects.calendar.hoursBefore', n: 2 },
  { value: '1440', labelKey: 'projects.calendar.daysBefore', n: 1 },
  { value: '2880', labelKey: 'projects.calendar.daysBefore', n: 2 },
  { value: '10080', labelKey: 'projects.calendar.weekBefore' },
];
