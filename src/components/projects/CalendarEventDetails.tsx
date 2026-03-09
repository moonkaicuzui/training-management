/**
 * Calendar Event Details - Event data transformation & helpers
 * 이벤트 데이터 변환 유틸리티 및 기본 폼 데이터
 */

import { addHours, addMonths } from 'date-fns';
import { CATEGORY_COLORS, TASK_STATUS_COLORS } from '@/types/project';
import type { CalendarEvent, Task, Recurrence, EventReminder } from '@/types/project';
import type { TrainingSession } from '@/types';
import type { CalendarEventItem, CalendarCategory, EventFormData } from './calendarTypes';
import { SESSION_STATUS_COLORS } from './calendarTypes';

// Default form data
export const defaultFormData: EventFormData = {
  title: '',
  description: '',
  startDate: new Date(),
  endDate: addHours(new Date(), 1),
  allDay: false,
  categoryId: '',
  location: '',
  url: '',
  recurrenceType: 'none',
  recurrenceInterval: 1,
  recurrenceEndType: 'never',
  recurrenceEndDate: addMonths(new Date(), 3),
  recurrenceEndCount: 10,
  reminderMinutes: null,
};

// Date로 변환하는 헬퍼 함수
export function toDate(value: Date | { toDate: () => Date } | string | number): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value) return value.toDate();
  return new Date(value);
}

// 반복 설정 빌드
export function buildRecurrence(formData: EventFormData): Recurrence | undefined {
  if (formData.recurrenceType === 'none') return undefined;
  const rec: Recurrence = {
    type: formData.recurrenceType,
    interval: formData.recurrenceInterval,
  };
  if (formData.recurrenceEndType === 'onDate') {
    rec.endDate = formData.recurrenceEndDate;
  } else if (formData.recurrenceEndType === 'afterCount') {
    rec.endCount = formData.recurrenceEndCount;
  }
  return rec;
}

// 알림 설정 빌드
export function buildReminders(formData: EventFormData): EventReminder[] | undefined {
  if (formData.reminderMinutes === null) return undefined;
  return [{ type: 'in_app', minutes: formData.reminderMinutes }];
}

// 이벤트를 폼 데이터로 변환
export function eventToFormData(
  ev: CalendarEvent,
  start: Date,
  end: Date,
  allDay: boolean
): EventFormData {
  const rec = ev.recurrence;
  const reminder = ev.reminders?.[0];
  return {
    title: ev.title,
    description: ev.description || '',
    startDate: start,
    endDate: end,
    allDay: allDay,
    categoryId: ev.categoryId || '',
    location: ev.location || '',
    url: (ev as CalendarEvent & { url?: string }).url || '',
    recurrenceType: rec?.type || 'none',
    recurrenceInterval: rec?.interval || 1,
    recurrenceEndType: rec?.endDate ? 'onDate' : rec?.endCount ? 'afterCount' : 'never',
    recurrenceEndDate: rec?.endDate ? toDate(rec.endDate) : addMonths(new Date(), 3),
    recurrenceEndCount: rec?.endCount || 10,
    reminderMinutes: reminder ? reminder.minutes : null,
  };
}

// 이벤트 + 과제 + 세션을 캘린더 형식으로 변환
export function buildCalendarEvents(
  events: CalendarEvent[],
  tasks: Task[],
  sessions: TrainingSession[],
  categories: CalendarCategory[],
  hiddenTypes: Set<string>,
  trainingLabel: string
): CalendarEventItem[] {
  const eventItems: CalendarEventItem[] = events
    .filter((event) => {
      if (event.categoryId && hiddenTypes.has(`cat-${event.categoryId}`)) return false;
      if (!event.categoryId && hiddenTypes.has('events')) return false;
      return true;
    })
    .map((event) => {
      const category = categories.find((c) => c.id === event.categoryId);
      const recurrencePrefix = event.recurrence ? '🔁 ' : '';
      return {
        id: event.id,
        title: `${recurrencePrefix}${event.title}`,
        start: toDate(event.startDate),
        end: toDate(event.endDate),
        allDay: event.allDay,
        resource: event,
        type: 'event' as const,
        color: category?.color || CATEGORY_COLORS[0],
        categoryId: event.categoryId,
      };
    });

  const taskItems: CalendarEventItem[] = hiddenTypes.has('tasks')
    ? []
    : tasks
        .filter((task) => task.startDate || task.dueDate)
        .map((task) => {
          const prefix = task.status === 'done' ? '✓ ' : '◆ ';
          const start = task.startDate ? toDate(task.startDate) : toDate(task.dueDate!);
          const end = task.dueDate ? toDate(task.dueDate) : start;
          return {
            id: `task-${task.id}`,
            title: `${prefix}${task.title}`,
            start,
            end,
            allDay: true,
            taskResource: task,
            type: 'task' as const,
            color: TASK_STATUS_COLORS[task.status],
          };
        });

  const sessionItems: CalendarEventItem[] = hiddenTypes.has('sessions')
    ? []
    : sessions
        .filter((s) => s.session_date && s.status !== 'CANCELLED')
        .map((session) => {
          const sessionDate = new Date(session.session_date);
          const statusIcon = session.status === 'COMPLETED' ? '✅ ' : '📚 ';
          return {
            id: `session-${session.session_id}`,
            title: `${statusIcon}${session.trainer_name || trainingLabel} - ${session.location || ''}`.trim(),
            start: sessionDate,
            end: sessionDate,
            allDay: true,
            sessionResource: session,
            type: 'session' as const,
            color: SESSION_STATUS_COLORS[session.status] || '#F59E0B',
          };
        });

  return [...eventItems, ...taskItems, ...sessionItems];
}
