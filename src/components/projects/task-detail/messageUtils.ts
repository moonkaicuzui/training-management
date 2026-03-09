/**
 * Message utility constants and components for TaskDetailDialog
 */

import type { MessageType } from '@/types/project';

export const MESSAGE_TYPE_COLORS: Record<MessageType, string> = {
  question: '#F59E0B',
  request: '#3B82F6',
  approval: '#10B981',
  rejection: '#EF4444',
  info: '#6366F1',
  comment: '#6B7280',
};

/**
 * Convert Firestore timestamp or various date formats to a Date object
 */
export const toDate = (value: Date | { toDate: () => Date } | string | number | undefined): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value) return value.toDate();
  return new Date(value);
};
