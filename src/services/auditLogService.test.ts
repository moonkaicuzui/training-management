/**
 * Audit Log Service Tests
 * auditLogService.ts 의 Firestore 로직 단위 테스트
 * APPEND-ONLY: 생성 및 조회만 테스트 (수정/삭제 없음)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase module
vi.mock('@/services/firebase', () => ({
  db: {},
  doc: vi.fn(() => 'mock-doc-ref'),
  collection: vi.fn(() => 'mock-collection-ref'),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  query: vi.fn(() => 'mock-query'),
  where: vi.fn(() => 'mock-where'),
  orderBy: vi.fn(() => 'mock-orderBy'),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
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
  getAuditLogs,
  createAuditLog,
} from '@/services/auditLogService';

import {
  getDocs,
  setDoc,
  doc,
  query,
  where,
  orderBy,
} from '@/services/firebase';

// ============================================================
// Test Data
// ============================================================

const mockAuditLogData: Record<string, unknown> = {
  log_id: 'log-001',
  entity_type: 'PROGRAM',
  entity_id: 'prog-001',
  action: 'CREATE',
  changed_by: 'admin@test.com',
  changed_at: '2024-01-15T10:00:00.000Z',
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0',
  before_data: null,
  after_data: { name: 'Safety Training', status: 'active' },
  reason: 'New program creation',
};

const createMockQuerySnapshot = (docs: Array<{ id: string; data: Record<string, unknown> }>) => ({
  docs: docs.map((d) => ({
    id: d.id,
    data: () => d.data,
    exists: () => true,
  })),
  empty: docs.length === 0,
});

// ============================================================
// Tests
// ============================================================

describe('auditLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // Read Operations
  // ----------------------------------------------------------

  describe('getAuditLogs', () => {
    it('필터 없이 모든 감사 로그를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'log-001', data: mockAuditLogData },
        ]) as never
      );

      const result = await getAuditLogs();

      expect(query).toHaveBeenCalled();
      expect(orderBy).toHaveBeenCalledWith('changed_at', 'desc');
      expect(result).toHaveLength(1);
      expect(result[0].log_id).toBe('log-001');
      expect(result[0].action).toBe('CREATE');
    });

    it('entityType 필터로 감사 로그를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'log-001', data: mockAuditLogData },
        ]) as never
      );

      await getAuditLogs({ entityType: 'PROGRAM' });

      expect(where).toHaveBeenCalledWith('entity_type', '==', 'PROGRAM');
    });

    it('action 필터로 감사 로그를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'log-001', data: mockAuditLogData },
        ]) as never
      );

      await getAuditLogs({ action: 'CREATE' });

      expect(where).toHaveBeenCalledWith('action', '==', 'CREATE');
    });

    it('dateFrom 필터로 시작일 이후 로그를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'log-001', data: { ...mockAuditLogData, changed_at: '2024-01-15T10:00:00.000Z' } },
          { id: 'log-002', data: { ...mockAuditLogData, log_id: 'log-002', changed_at: '2024-01-01T10:00:00.000Z' } },
        ]) as never
      );

      const result = await getAuditLogs({ dateFrom: '2024-01-10T00:00:00.000Z' });

      expect(result).toHaveLength(1);
      expect(result[0].log_id).toBe('log-001');
    });

    it('dateTo 필터로 종료일 이전 로그를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'log-001', data: { ...mockAuditLogData, changed_at: '2024-01-15T10:00:00.000Z' } },
          { id: 'log-002', data: { ...mockAuditLogData, log_id: 'log-002', changed_at: '2024-02-15T10:00:00.000Z' } },
        ]) as never
      );

      const result = await getAuditLogs({ dateTo: '2024-01-31T23:59:59.000Z' });

      expect(result).toHaveLength(1);
      expect(result[0].log_id).toBe('log-001');
    });

    it('changedBy 필터로 변경자 기반 검색을 수행한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'log-001', data: { ...mockAuditLogData, changed_by: 'admin@test.com' } },
          { id: 'log-002', data: { ...mockAuditLogData, log_id: 'log-002', changed_by: 'user@test.com' } },
        ]) as never
      );

      const result = await getAuditLogs({ changedBy: 'admin' });

      expect(result).toHaveLength(1);
      expect(result[0].changed_by).toBe('admin@test.com');
    });

    it('여러 필터를 동시에 적용할 수 있다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'log-001', data: mockAuditLogData },
        ]) as never
      );

      await getAuditLogs({
        entityType: 'PROGRAM',
        action: 'CREATE',
      });

      expect(where).toHaveBeenCalledWith('entity_type', '==', 'PROGRAM');
      expect(where).toHaveBeenCalledWith('action', '==', 'CREATE');
    });

    it('날짜 범위와 변경자를 함께 필터링할 수 있다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'log-001', data: { ...mockAuditLogData, changed_at: '2024-01-15T10:00:00.000Z', changed_by: 'admin@test.com' } },
          { id: 'log-002', data: { ...mockAuditLogData, log_id: 'log-002', changed_at: '2024-01-20T10:00:00.000Z', changed_by: 'user@test.com' } },
          { id: 'log-003', data: { ...mockAuditLogData, log_id: 'log-003', changed_at: '2024-02-15T10:00:00.000Z', changed_by: 'admin@test.com' } },
        ]) as never
      );

      const result = await getAuditLogs({
        dateFrom: '2024-01-10T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.000Z',
        changedBy: 'admin',
      });

      expect(result).toHaveLength(1);
      expect(result[0].log_id).toBe('log-001');
    });

    it('빈 결과를 반환할 수 있다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      const result = await getAuditLogs();

      expect(result).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------
  // Write Operations (APPEND-ONLY)
  // ----------------------------------------------------------

  describe('createAuditLog', () => {
    it('새 감사 로그를 생성한다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      const input = {
        log_id: 'log-new',
        entity_type: 'RESULT' as const,
        entity_id: 'result-001',
        action: 'UPDATE' as const,
        changed_by: 'trainer@test.com',
        ip_address: '10.0.0.1',
        user_agent: 'Chrome/120',
        before_data: { score: 70 },
        after_data: { score: 85 },
        reason: 'Score correction after review',
      };

      const result = await createAuditLog(input);

      expect(doc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          ...input,
          changed_at: 'SERVER_TIMESTAMP',
        })
      );
      expect(result.log_id).toBe('log-new');
      expect(result.entity_type).toBe('RESULT');
      expect(result.action).toBe('UPDATE');
      expect(result.changed_at).toBeTruthy();
    });

    it('before_data와 after_data 없이 로그를 생성할 수 있다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      const input = {
        log_id: 'log-view',
        entity_type: 'PROGRAM' as const,
        entity_id: 'prog-001',
        action: 'VIEW' as const,
        changed_by: 'viewer@test.com',
        before_data: null,
        after_data: null,
      };

      const result = await createAuditLog(input);

      expect(setDoc).toHaveBeenCalled();
      expect(result.log_id).toBe('log-view');
      expect(result.action).toBe('VIEW');
      expect(result.before_data).toBeNull();
      expect(result.after_data).toBeNull();
    });

    it('LOGIN 액션 로그를 생성할 수 있다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      const input = {
        log_id: 'log-login',
        entity_type: 'USER' as const,
        entity_id: 'user-001',
        action: 'LOGIN' as const,
        changed_by: 'user@test.com',
        ip_address: '192.168.0.100',
        user_agent: 'Firefox/121',
        before_data: null,
        after_data: null,
      };

      const result = await createAuditLog(input);

      expect(result.log_id).toBe('log-login');
      expect(result.action).toBe('LOGIN');
      expect(result.entity_type).toBe('USER');
    });
  });
});
