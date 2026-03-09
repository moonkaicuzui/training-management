/**
 * 시스템 피드백 (이슈 등록 / 개선 요청) 타입 정의
 */

import { Timestamp } from 'firebase/firestore';

/** 피드백 카테고리 */
export type FeedbackCategory = 'BUG' | 'IMPROVEMENT' | 'NEW_FEATURE' | 'UI_UX' | 'DATA' | 'OTHER';

/** 피드백 우선순위 */
export type FeedbackPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** 피드백 상태 */
export type FeedbackStatus = 'SUBMITTED' | 'REVIEWING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

/** 피드백 댓글 */
export interface FeedbackComment {
  author: string;
  text: string;
  createdAt: Date | Timestamp;
}

/** 시스템 피드백 */
export interface SystemFeedback {
  id: string;
  title: string;
  category: FeedbackCategory;
  description: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  screenshots: string[];
  submittedBy: string;
  assignedTo?: string;
  comments: FeedbackComment[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

/** 피드백 생성 입력 */
export interface CreateFeedbackInput {
  title: string;
  category: FeedbackCategory;
  description: string;
  priority: FeedbackPriority;
  screenshots: string[];
  submittedBy: string;
}

/** 피드백 수정 입력 */
export interface UpdateFeedbackInput {
  title?: string;
  category?: FeedbackCategory;
  description?: string;
  priority?: FeedbackPriority;
  status?: FeedbackStatus;
  assignedTo?: string;
  screenshots?: string[];
}

/** 카테고리 라벨 (i18n 키 매핑용) */
export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  'BUG', 'IMPROVEMENT', 'NEW_FEATURE', 'UI_UX', 'DATA', 'OTHER',
];

/** 우선순위 목록 */
export const FEEDBACK_PRIORITIES: FeedbackPriority[] = [
  'LOW', 'MEDIUM', 'HIGH', 'CRITICAL',
];

/** 상태 목록 */
export const FEEDBACK_STATUSES: FeedbackStatus[] = [
  'SUBMITTED', 'REVIEWING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED',
];

/** 우선순위 색상 */
export const PRIORITY_COLORS: Record<FeedbackPriority, string> = {
  LOW: '#6B7280',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#DC2626',
};

/** 상태 색상 */
export const STATUS_COLORS: Record<FeedbackStatus, string> = {
  SUBMITTED: '#6B7280',
  REVIEWING: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  COMPLETED: '#10B981',
  REJECTED: '#EF4444',
};
