/**
 * Shared types for TaskDetailDialog and its sub-components
 */

import type { MessageType } from '@/types/project';

export interface Member {
  id: string;
  name: string;
  email: string;
  department?: string;
  photoURL?: string;
  status: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  type: MessageType;
  createdAt: Date | { toDate: () => Date };
  mentions?: string[];
  readBy: Record<string, unknown>;
  isResolved?: boolean;
}

export interface Project {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: string;
  isActive: boolean;
}
