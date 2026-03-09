/**
 * 프로젝트 메시지/채팅 서비스
 *
 * 메시지 CRUD, 읽음/해결 처리, 실시간 구독, 알림
 */

import {
  db,
  doc,
  collection,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  onSnapshot,
} from '@/services/firebase';
import type {
  Message,
  CreateMessageInput,
  ProjectNotification,
} from '@/types/project';
import { COLLECTIONS, generateId, convertDocumentDates } from './common';
import { logger } from '@/utils/logger';

// ============================================================
// Message (댓글) Service
// ============================================================

/** 과제의 메시지 조회 */
export const getMessagesByTask = async (taskId: string): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Message
    );
  } catch (error) {
    logger.error('[projectMessageService] getMessagesByTask failed:', error);
    throw error;
  }
};

/** 메시지 생성 */
export const createMessage = async (
  input: CreateMessageInput,
  senderId: string
): Promise<Message> => {
  try {
    const messageId = generateId('msg');
    const now = serverTimestamp();

    const messageData = {
      ...input,
      senderId,
      type: input.type || 'comment',
      readBy: {}, // 빈 객체로 시작
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, COLLECTIONS.MESSAGES, messageId), messageData);

    return {
      id: messageId,
      ...messageData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Message;
  } catch (error) {
    logger.error('[projectMessageService] createMessage failed:', error);
    throw error;
  }
};

/** 메시지 읽음 표시 */
export const markMessageAsRead = async (
  messageId: string,
  userId: string
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.MESSAGES, messageId);
    await updateDoc(docRef, {
      [`readBy.${userId}`]: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[projectMessageService] markMessageAsRead failed:', error);
    throw error;
  }
};

/** 메시지 해결 표시 */
export const resolveMessage = async (
  messageId: string,
  resolvedBy: string
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.MESSAGES, messageId);
    await updateDoc(docRef, {
      isResolved: true,
      resolvedAt: serverTimestamp(),
      resolvedBy,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[projectMessageService] resolveMessage failed:', error);
    throw error;
  }
};

/** 메시지 실시간 구독 */
export const subscribeMessagesRealtime = (
  taskId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where('taskId', '==', taskId),
    orderBy('createdAt', 'asc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Message
    );
    callback(messages);
  });
};

/** 읽지 않은 메시지 수 조회 */
export const getUnreadMessageCount = async (
  userId: string,
  taskId?: string
): Promise<number> => {
  try {
    let q = query(collection(db, COLLECTIONS.MESSAGES));

    if (taskId) {
      q = query(q, where('taskId', '==', taskId), limit(100));
    } else {
      q = query(q, limit(500));
    }

    const snapshot = await getDocs(q);
    let unreadCount = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // 본인이 보낸 메시지가 아니고, readBy에 userId가 없으면 미읽음
      if (data.senderId !== userId && !data.readBy?.[userId]) {
        unreadCount++;
      }
    });

    return unreadCount;
  } catch (error) {
    logger.error('[projectMessageService] getUnreadMessageCount failed:', error);
    throw error;
  }
};

// ============================================================
// Notification Service
// ============================================================

/** 알림 생성 */
export const createNotification = async (
  data: Omit<ProjectNotification, 'id' | 'createdAt'>
): Promise<ProjectNotification> => {
  try {
    const notificationId = generateId('notif');
    const now = serverTimestamp();

    const notifData = {
      ...data,
      createdAt: now,
    };

    await setDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), notifData);

    return {
      id: notificationId,
      ...data,
      createdAt: new Date(),
    } as ProjectNotification;
  } catch (error) {
    logger.error('[projectMessageService] createNotification failed:', error);
    throw error;
  }
};

/** 사용자별 알림 조회 */
export const getNotificationsByUser = async (
  userId: string,
  maxCount: number = 50
): Promise<ProjectNotification[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as ProjectNotification
    );
  } catch (error) {
    logger.error('[projectMessageService] getNotificationsByUser failed:', error);
    throw error;
  }
};

/** 알림 읽음 처리 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await updateDoc(docRef, {
      isRead: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[projectMessageService] markNotificationAsRead failed:', error);
    throw error;
  }
};

/** 전체 알림 읽음 처리 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      where('isRead', '==', false),
      limit(100)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, {
        isRead: true,
        readAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    logger.error('[projectMessageService] markAllNotificationsAsRead failed:', error);
    throw error;
  }
};

/** 알림 실시간 구독 */
export const subscribeNotificationsRealtime = (
  userId: string,
  callback: (notifications: ProjectNotification[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as ProjectNotification
    );
    callback(notifications);
  });
};
