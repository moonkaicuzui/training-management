/**
 * Notification Service Tests
 * notificationService.ts 의 Firestore CRUD 로직 단위 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase module
const mockBatch = {
  update: vi.fn(),
  delete: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/services/firebase', () => ({
  db: {},
  doc: vi.fn(() => 'mock-doc-ref'),
  collection: vi.fn(() => 'mock-collection-ref'),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(() => 'mock-query'),
  where: vi.fn(() => 'mock-where'),
  orderBy: vi.fn(() => 'mock-orderBy'),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  writeBatch: vi.fn(() => mockBatch),
  Timestamp: class MockTimestamp {
    toDate() {
      return new Date('2024-01-01T00:00:00.000Z');
    }
    static fromDate(d: Date) {
      return { toDate: () => d };
    }
  },
}));

import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  batchDeleteNotifications,
  getSettings,
  updateSettings,
} from '@/services/notificationService';

import {
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  writeBatch,
} from '@/services/firebase';

// ============================================================
// Test Data
// ============================================================

const mockNotificationData: Record<string, unknown> = {
  notification_id: 'notif-001',
  type: 'TRAINING_REMINDER',
  priority: 'MEDIUM',
  title: 'Training Reminder',
  message: 'You have a training session tomorrow.',
  recipient_id: 'emp-001',
  recipient_type: 'EMPLOYEE',
  related_entity: { type: 'SESSION', id: 'sess-001' },
  is_read: false,
  created_at: '2024-01-15T08:00:00.000Z',
  expires_at: '2024-02-15T08:00:00.000Z',
};

const mockSettingsData = {
  emailNotifications: true,
  inAppNotifications: true,
  trainingReminder: true,
  expiryWarning: true,
  retrainingRequired: true,
  reminderDays: [30, 14, 7, 1],
};

const createMockDocSnapshot = (id: string, data: Record<string, unknown>, exists = true) => ({
  id,
  data: () => data,
  exists: () => exists,
});

const createMockQuerySnapshot = (
  docs: Array<{ id: string; data: Record<string, unknown>; ref?: unknown }>
) => ({
  docs: docs.map((d) => ({
    id: d.id,
    data: () => d.data,
    exists: () => true,
    ref: d.ref || `ref-${d.id}`,
  })),
  empty: docs.length === 0,
});

// ============================================================
// Tests
// ============================================================

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatch.update.mockClear();
    mockBatch.delete.mockClear();
    mockBatch.commit.mockClear().mockResolvedValue(undefined);
  });

  // ----------------------------------------------------------
  // Notification Read Operations
  // ----------------------------------------------------------

  describe('getNotifications', () => {
    it('userId 없이 모든 알림을 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'notif-001', data: mockNotificationData },
        ]) as never
      );

      const result = await getNotifications();

      expect(query).toHaveBeenCalled();
      expect(orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(result).toHaveLength(1);
      expect(result[0].notification_id).toBe('notif-001');
    });

    it('userId로 사용자별 알림을 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'notif-001', data: mockNotificationData },
        ]) as never
      );

      await getNotifications('emp-001');

      expect(where).toHaveBeenCalledWith('recipient_id', '==', 'emp-001');
    });

    it('type 필터로 알림을 필터링한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'notif-001', data: { ...mockNotificationData, type: 'TRAINING_REMINDER' } },
          { id: 'notif-002', data: { ...mockNotificationData, notification_id: 'notif-002', type: 'SYSTEM' } },
        ]) as never
      );

      const result = await getNotifications(undefined, { type: 'TRAINING_REMINDER' });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('TRAINING_REMINDER');
    });

    it('priority 필터로 알림을 필터링한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'notif-001', data: { ...mockNotificationData, priority: 'HIGH' } },
          { id: 'notif-002', data: { ...mockNotificationData, notification_id: 'notif-002', priority: 'LOW' } },
        ]) as never
      );

      const result = await getNotifications(undefined, { priority: 'HIGH' });

      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe('HIGH');
    });

    it('isRead 필터로 읽지 않은 알림만 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'notif-001', data: { ...mockNotificationData, is_read: false } },
          { id: 'notif-002', data: { ...mockNotificationData, notification_id: 'notif-002', is_read: true } },
        ]) as never
      );

      const result = await getNotifications(undefined, { isRead: false });

      expect(result).toHaveLength(1);
      expect(result[0].is_read).toBe(false);
    });

    it('search 필터로 제목 기반 검색을 수행한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'notif-001', data: { ...mockNotificationData, title: 'Training Reminder', message: 'Please attend the session.' } },
          { id: 'notif-002', data: { ...mockNotificationData, notification_id: 'notif-002', title: 'System Update', message: 'System will be updated.' } },
        ]) as never
      );

      const result = await getNotifications(undefined, { search: 'training' });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Training Reminder');
    });

    it('search 필터로 메시지 기반 검색을 수행한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'notif-001', data: { ...mockNotificationData, title: 'Alert', message: 'Training session tomorrow' } },
          { id: 'notif-002', data: { ...mockNotificationData, notification_id: 'notif-002', title: 'Info', message: 'System maintenance scheduled' } },
        ]) as never
      );

      const result = await getNotifications(undefined, { search: 'maintenance' });

      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('System maintenance scheduled');
    });

    it('빈 결과를 반환할 수 있다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      const result = await getNotifications();

      expect(result).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------
  // Notification Write Operations
  // ----------------------------------------------------------

  describe('createNotification', () => {
    it('새 알림을 생성한다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      const input = {
        notification_id: 'notif-new',
        type: 'SYSTEM' as const,
        priority: 'LOW' as const,
        title: 'New Notification',
        message: 'This is a new notification.',
        recipient_id: 'emp-001',
        recipient_type: 'EMPLOYEE' as const,
        is_read: false,
      };

      const result = await createNotification(input);

      expect(doc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          ...input,
          created_at: 'SERVER_TIMESTAMP',
        })
      );
      expect(result.notification_id).toBe('notif-new');
      expect(result.title).toBe('New Notification');
      expect(result.created_at).toBeTruthy();
    });
  });

  describe('markAsRead', () => {
    it('알림을 읽음으로 표시한다', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await markAsRead('notif-001');

      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        { is_read: true }
      );
    });
  });

  describe('markAllAsRead', () => {
    it('사용자의 모든 읽지 않은 알림을 읽음으로 표시한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'notif-001', data: mockNotificationData, ref: 'ref-notif-001' },
          { id: 'notif-002', data: { ...mockNotificationData, notification_id: 'notif-002' }, ref: 'ref-notif-002' },
        ]) as never
      );

      await markAllAsRead('emp-001');

      expect(where).toHaveBeenCalledWith('recipient_id', '==', 'emp-001');
      expect(where).toHaveBeenCalledWith('is_read', '==', false);
      expect(writeBatch).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('읽지 않은 알림이 없으면 배치를 실행하지 않는다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      await markAllAsRead('emp-001');

      expect(writeBatch).not.toHaveBeenCalled();
      expect(mockBatch.commit).not.toHaveBeenCalled();
    });
  });

  describe('deleteNotification', () => {
    it('알림을 삭제한다', async () => {
      vi.mocked(deleteDoc).mockResolvedValue(undefined as never);

      await deleteNotification('notif-001');

      expect(doc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });
  });

  describe('batchDeleteNotifications', () => {
    it('여러 알림을 배치로 삭제한다', async () => {
      await batchDeleteNotifications(['notif-001', 'notif-002', 'notif-003']);

      expect(writeBatch).toHaveBeenCalled();
      expect(mockBatch.delete).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('빈 배열이면 배치를 실행하지 않는다', async () => {
      await batchDeleteNotifications([]);

      expect(writeBatch).not.toHaveBeenCalled();
      expect(mockBatch.commit).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // Settings Operations
  // ----------------------------------------------------------

  describe('getSettings', () => {
    it('사용자의 알림 설정을 조회한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('user-001', mockSettingsData) as never
      );

      const result = await getSettings('user-001');

      expect(doc).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result!.emailNotifications).toBe(true);
      expect(result!.reminderDays).toEqual([30, 14, 7, 1]);
    });

    it('설정이 없으면 null을 반환한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('user-none', {}, false) as never
      );

      const result = await getSettings('user-none');

      expect(result).toBeNull();
    });
  });

  describe('updateSettings', () => {
    it('알림 설정을 업데이트한다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      await updateSettings('user-001', {
        emailNotifications: false,
        reminderDays: [7, 1],
      });

      expect(doc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        { emailNotifications: false, reminderDays: [7, 1] },
        { merge: true }
      );
    });

    it('부분 업데이트가 가능하다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      await updateSettings('user-001', { trainingReminder: false });

      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        { trainingReminder: false },
        { merge: true }
      );
    });
  });
});
