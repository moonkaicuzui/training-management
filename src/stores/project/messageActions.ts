/**
 * Message CRUD actions for ProjectStore
 */

import type { CreateMessageInput } from '@/types/project';
import * as projectService from '@/services/projectService';
import { logger } from '@/utils/logger';
import type { StoreSet, StoreGet } from './types';
import { getCurrentUserId } from './helpers';
import i18n from '@/i18n';

export const createMessageActions = (set: StoreSet, get: StoreGet) => ({
  fetchMessagesByTask: async (taskId: string) => {
    set({ isMessagesLoading: true, error: null });
    try {
      const messages = await projectService.getMessagesByTask(taskId);
      set({ messages, isMessagesLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('errors.project.fetchMessagesFailed'),
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
        error: error instanceof Error ? error.message : i18n.t('errors.project.createMessageFailed'),
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
        error: error instanceof Error ? error.message : i18n.t('errors.project.resolveMessageFailed'),
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
