/**
 * Message CRUD actions for ProjectStore
 */

import type { CreateMessageInput } from '@/types/project';
import * as projectService from '@/services/projectService';
import { logger } from '@/utils/logger';
import type { StoreSet, StoreGet } from './types';
import { getCurrentUserId } from './helpers';

export const createMessageActions = (set: StoreSet, get: StoreGet) => ({
  fetchMessagesByTask: async (taskId: string) => {
    set({ isMessagesLoading: true, error: null });
    try {
      const messages = await projectService.getMessagesByTask(taskId);
      set({ messages, isMessagesLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '메시지 목록을 불러오는데 실패했습니다.',
        isMessagesLoading: false,
      });
    }
  },

  createMessage: async (input: CreateMessageInput) => {
    set({ isLoading: true, error: null });
    try {
      const senderId = getCurrentUserId();
      const message = await projectService.createMessage(input, senderId);
      set((state) => ({
        messages: [...state.messages, message],
        isLoading: false,
      }));
      return message;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '메시지 생성에 실패했습니다.',
        isLoading: false,
      });
      throw error;
    }
  },

  markMessageAsRead: async (messageId: string) => {
    try {
      const userId = getCurrentUserId();
      await projectService.markMessageAsRead(messageId, userId);
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId
            ? { ...m, readBy: { ...m.readBy, [userId]: new Date() } }
            : m
        ),
      }));
    } catch (error) {
      logger.error('[projectStore] markMessageAsRead failed:', error);
    }
  },

  resolveMessage: async (messageId: string) => {
    set({ isLoading: true, error: null });
    try {
      const resolvedBy = getCurrentUserId();
      await projectService.resolveMessage(messageId, resolvedBy);
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId
            ? { ...m, isResolved: true, resolvedAt: new Date(), resolvedBy }
            : m
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '메시지 해결에 실패했습니다.',
        isLoading: false,
      });
      throw error;
    }
  },

  subscribeMessagesRealtime: (taskId: string) => {
    // Unsubscribe existing messages listener if any
    const { messagesUnsubscribe } = get();
    if (messagesUnsubscribe) messagesUnsubscribe();

    const unsubscribe = projectService.subscribeMessagesRealtime(taskId, (messages) => {
      set({ messages });
    });
    set({ messagesUnsubscribe: unsubscribe });
  },
});
