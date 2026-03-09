/**
 * 프로젝트 서비스 공통 모듈
 *
 * 컬렉션명, 헬퍼 함수 등 프로젝트 서비스 전반에서 공유하는 유틸리티
 */

import { Timestamp } from '@/services/firebase';
import type { DocumentData } from 'firebase/firestore';

// ============================================================
// Collection Names
// ============================================================

export const COLLECTIONS = {
  MEMBERS: 'project_members',
  PROJECTS: 'projects',
  TASKS: 'project_tasks',
  MESSAGES: 'project_messages',
  CATEGORIES: 'project_categories',
  EVENTS: 'project_events',
  AUTOMATIONS: 'project_automations',
  NOTIFICATIONS: 'project_notifications',
  SETTINGS: 'project_settings',
} as const;

// ============================================================
// Helper Functions
// ============================================================

/** 고유 ID 생성 */
export const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${randomStr}`;
};

/** Timestamp를 Date로 변환 */
export const convertTimestamp = (timestamp: Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

/** 문서 데이터에서 타입스탬프 변환 */
export const convertDocumentDates = <T extends DocumentData>(data: T): T => {
  const converted = { ...data } as Record<string, unknown>;
  const dateFields = ['createdAt', 'updatedAt', 'lastActive', 'startDate', 'dueDate', 'completedAt', 'lastRunAt', 'readAt', 'resolvedAt'];

  dateFields.forEach((field) => {
    if (converted[field] instanceof Timestamp) {
      converted[field] = (converted[field] as Timestamp).toDate();
    }
  });

  // readBy 객체 내부의 Timestamp 변환
  if (converted.readBy && typeof converted.readBy === 'object') {
    const convertedReadBy: Record<string, Date | null> = {};
    Object.entries(converted.readBy as Record<string, unknown>).forEach(([key, value]) => {
      if (value instanceof Timestamp) {
        convertedReadBy[key] = value.toDate();
      } else {
        convertedReadBy[key] = value as Date | null;
      }
    });
    converted.readBy = convertedReadBy;
  }

  return converted as T;
};
