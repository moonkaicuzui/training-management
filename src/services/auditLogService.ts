/**
 * Audit Log Firebase Service
 *
 * Firestore operations for the 'auditLogs' collection.
 * APPEND-ONLY: No update or delete operations.
 * 감사 로그는 수정/삭제 불가
 */

import {
  db,
  doc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  setDoc,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import type { AuditLogEntry, AuditLogFilters } from '@/types/auditLog';

// ============================================================
// Collection Name
// ============================================================

const COLLECTION = 'auditLogs';

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

const docToAuditLog = (docId: string, data: Record<string, unknown>): AuditLogEntry => {
  return {
    log_id: (data.log_id as string) || docId,
    entity_type: (data.entity_type as AuditLogEntry['entity_type']) || 'UNKNOWN',
    entity_id: (data.entity_id as string) || '',
    action: (data.action as AuditLogEntry['action']) || 'VIEW',
    changed_by: (data.changed_by as string) || '',
    changed_at: convertTimestampToString(data.changed_at as Timestamp | string | undefined),
    ip_address: (data.ip_address as string) || undefined,
    user_agent: (data.user_agent as string) || undefined,
    before_data: (data.before_data as Record<string, unknown>) || null,
    after_data: (data.after_data as Record<string, unknown>) || null,
    reason: (data.reason as string) || undefined,
  };
};

// ============================================================
// Read Operations
// ============================================================

export const getAuditLogs = async (
  filters?: AuditLogFilters
): Promise<AuditLogEntry[]> => {
  const constraints = [];

  if (filters?.entityType) {
    constraints.push(where('entity_type', '==', filters.entityType));
  }
  if (filters?.action) {
    constraints.push(where('action', '==', filters.action));
  }

  constraints.push(orderBy('changed_at', 'desc'));

  const q = query(collection(db, COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToAuditLog(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side filters for date range and user
  if (filters?.dateFrom) {
    results = results.filter((log) => log.changed_at >= filters.dateFrom!);
  }
  if (filters?.dateTo) {
    results = results.filter((log) => log.changed_at <= filters.dateTo!);
  }
  if (filters?.changedBy) {
    const searchLower = filters.changedBy.toLowerCase();
    results = results.filter((log) =>
      log.changed_by.toLowerCase().includes(searchLower)
    );
  }

  return results;
};

// ============================================================
// Write Operations (CREATE ONLY - APPEND-ONLY)
// ============================================================

export const createAuditLog = async (
  data: Omit<AuditLogEntry, 'changed_at'>
): Promise<AuditLogEntry> => {
  const docRef = doc(db, COLLECTION, data.log_id);
  const now = serverTimestamp();

  // entity_type이 없으면 기본값 'UNKNOWN' 설정 (null 감사 로그 방지)
  const entityType = data.entity_type || ('UNKNOWN' as AuditLogEntry['entity_type']);

  await setDoc(docRef, {
    ...data,
    entity_type: entityType,
    changed_at: now,
  });

  return {
    ...data,
    changed_at: new Date().toISOString(),  // 반환 객체용 (Firestore에는 serverTimestamp 저장됨)
  };
};
