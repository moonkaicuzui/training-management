/**
 * Audit Log Types
 * 감사 로그 타입 정의
 */

import type { ChangeAction } from './index';

export type AuditAction = ChangeAction | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT';
export type AuditEntityType = 'PROGRAM' | 'RESULT' | 'SESSION' | 'EMPLOYEE' | 'USER' | 'METAL_SHOE_CASE';

export interface AuditLogEntry {
  log_id: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  changed_by: string;
  changed_at: string;
  ip_address?: string;
  user_agent?: string;
  before_data?: Record<string, unknown> | null;
  after_data?: Record<string, unknown> | null;
  reason?: string;
}

export interface AuditLogFilters {
  entityType?: AuditEntityType;
  action?: AuditAction;
  changedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}
