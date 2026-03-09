/**
 * Notification actions for ProjectStore
 */

import type { ProjectNotification } from '@/types/project';
import * as projectService from '@/services/projectService';
import { logger } from '@/utils/logger';
import type { StoreSet, StoreGet } from './types';
import { getCurrentUserId } from './helpers';

export const createNotificationActions = (set: StoreSet, get: StoreGet) => ({
  fetchNotifications: async () => {
    try {
      const userId = getCurrentUserId();
      if (userId === 'unknown') return;
      const notifications = await projectService.getNotificationsByUser(userId);
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadNotificationCount: unreadCount });
    } catch (error) {
      logger.error('[projectStore] fetchNotifications failed:', error);
    }
  },

  subscribeNotificationsRealtime: () => {
    const { notificationsUnsubscribe } = get();
    if (notificationsUnsubscribe) notificationsUnsubscribe();

    const userId = getCurrentUserId();
    if (userId === 'unknown') return;

    const unsubscribe = projectService.subscribeNotificationsRealtime(userId, (notifications) => {
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadNotificationCount: unreadCount });
    });
    set({ notificationsUnsubscribe: unsubscribe });
  },

  markNotificationRead: async (notificationId: string) => {
    try {
      await projectService.markNotificationAsRead(notificationId);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
        );
        return {
          notifications: updated,
          unreadNotificationCount: updated.filter((n) => !n.isRead).length,
        };
      });
    } catch (error) {
      logger.error('[projectStore] markNotificationRead failed:', error);
    }
  },

  markAllNotificationsRead: async () => {
    try {
      const userId = getCurrentUserId();
      await projectService.markAllNotificationsAsRead(userId);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true, readAt: new Date() })),
        unreadNotificationCount: 0,
      }));
    } catch (error) {
      logger.error('[projectStore] markAllNotificationsRead failed:', error);
    }
  },

  createNotification: async (data: Omit<ProjectNotification, 'id' | 'createdAt'>) => {
    try {
      await projectService.createNotification(data);
    } catch (error) {
      logger.error('[projectStore] createNotification failed:', error);
    }
  },
});
