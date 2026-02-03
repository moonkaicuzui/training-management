import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'retraining' | 'expiring' | 'session' | 'capa';
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...state.notifications,
          ].slice(0, 50), // Keep max 50 notifications
        })),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearAll: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: 'q-train-notifications',
    }
  )
);
