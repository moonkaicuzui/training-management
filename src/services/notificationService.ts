/**
 * Notification Firebase Service
 *
 * Firestore CRUD operations for 'notifications' and 'notificationSettings' collections.
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  limit,
  Timestamp,
} from '@/services/firebase';
import type { Notification, NotificationType, NotificationPriority } from '@/types/notification';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Names
// ============================================================

const NOTIFICATIONS_COLLECTION = 'notifications';
const SETTINGS_COLLECTION = 'notificationSettings';

// ============================================================
// Settings Type
// ============================================================

export interface NotificationSettingsData {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  trainingReminder: boolean;
  expiryWarning: boolean;
  retrainingRequired: boolean;
  reminderDays: number[];
}

// ============================================================
// Filter Type
// ============================================================

export interface NotificationQueryFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
  search?: string;
}

// ============================================================
// Helper Functions
// ============================================================

const convertTimestampToString = (
  timestamp: Timestamp | string | undefined
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

const docToNotification = (docId: string, data: Record<string, unknown>): Notification => {
  return {
    notification_id: (data.notification_id as string) || docId,
    type: (data.type as NotificationType) || 'SYSTEM',
    priority: (data.priority as NotificationPriority) || 'LOW',
    title: (data.title as string) || '',
    message: (data.message as string) || '',
    recipient_id: (data.recipient_id as string) || undefined,
    recipient_type: (data.recipient_type as Notification['recipient_type']) || 'EMPLOYEE',
    related_entity: data.related_entity as Notification['related_entity'] | undefined,
    is_read: (data.is_read as boolean) || false,
    created_at: convertTimestampToString(data.created_at as Timestamp | string | undefined),
    expires_at: (data.expires_at as string) || undefined,
  };
};

// ============================================================
// Notification Read Operations
// ============================================================

export const getNotifications = async (
  userId?: string,
  filters?: NotificationQueryFilters
): Promise<Notification[]> => {
  const constraints = [];

  if (userId) {
    constraints.push(where('recipient_id', '==', userId));
  }

  constraints.push(orderBy('created_at', 'desc'));
  constraints.push(limit(100));

  const q = query(collection(db, NOTIFICATIONS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToNotification(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side filters
  if (filters?.type) {
    results = results.filter((n) => n.type === filters.type);
  }
  if (filters?.priority) {
    results = results.filter((n) => n.priority === filters.priority);
  }
  if (filters?.isRead !== undefined) {
    results = results.filter((n) => n.is_read === filters.isRead);
  }
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      (n) =>
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower)
    );
  }

  return results;
};

// ============================================================
// Notification Write Operations
// ============================================================

export const createNotification = async (
  data: Omit<Notification, 'created_at'>
): Promise<Notification> => {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, data.notification_id);
    const now = serverTimestamp();

    await setDoc(docRef, {
      ...data,
      created_at: now,
    });

    return {
      ...data,
      created_at: new Date().toISOString(),  // 반환 객체용 (Firestore에는 serverTimestamp 저장됨)
    };
  } catch (error) {
    logger.error(`[notificationService] createNotification failed for ${data.notification_id}:`, error);
    throw error;
  }
};

export const markAsRead = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
    await updateDoc(docRef, {
      is_read: true,
    });
  } catch (error) {
    logger.error(`[notificationService] markAsRead failed for ${id}:`, error);
    throw error;
  }
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('recipient_id', '==', userId),
      where('is_read', '==', false)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const BATCH_SIZE = 500;
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const chunk = docs.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const d of chunk) {
        batch.update(d.ref, { is_read: true });
      }

      await batch.commit();
    }
  } catch (error) {
    logger.error(`[notificationService] markAllAsRead failed for user ${userId}:`, error);
    throw error;
  }
};

export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error(`[notificationService] deleteNotification failed for ${id}:`, error);
    throw error;
  }
};

export const batchDeleteNotifications = async (ids: string[]): Promise<void> => {
  try {
    const BATCH_SIZE = 500;

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const chunk = ids.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const id of chunk) {
        const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
        batch.delete(docRef);
      }

      await batch.commit();
    }
  } catch (error) {
    logger.error(`[notificationService] batchDeleteNotifications failed for ${ids.length} items:`, error);
    throw error;
  }
};

// ============================================================
// Settings Operations
// ============================================================

export const getSettings = async (
  userId: string
): Promise<NotificationSettingsData | null> => {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as NotificationSettingsData;
};

export const updateSettings = async (
  userId: string,
  data: Partial<NotificationSettingsData>
): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    logger.error(`[notificationService] updateSettings failed for user ${userId}:`, error);
    throw error;
  }
};

// ============================================================
// Real-time Subscription
// ============================================================

/**
 * 특정 사용자의 알림 실시간 구독
 * 최신순으로 정렬, 최대 50건
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): (() => void) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('recipient_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((d) =>
        docToNotification(d.id, d.data() as Record<string, unknown>)
      );
      callback(notifications);
    },
    (error) => {
      logger.error(`[notificationService] subscribeToNotifications failed for user ${userId}:`, error);
    }
  );
};
