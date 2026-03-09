import type { ReactNode } from 'react';
import type { AuditLogEntry, AuditAction } from '@/types/auditLog';

export interface AuditLogStats {
  total: number;
  creates: number;
  updates: number;
  deletes: number;
  uniqueUsers: number;
}

export interface AuditLogFiltersState {
  searchQuery: string;
  selectedEntityType: string;
  selectedAction: string;
  selectedPeriod: string;
}

export interface AuditLogFiltersProps {
  searchQuery: string;
  selectedEntityType: string;
  selectedAction: string;
  selectedPeriod: string;
  onSearchChange: (value: string) => void;
  onEntityTypeChange: (value: string) => void;
  onActionChange: (value: string) => void;
  onPeriodChange: (value: string) => void;
}

export interface AuditLogStatsCardsProps {
  stats: AuditLogStats;
}

export interface AuditLogTableProps {
  logs: AuditLogEntry[];
  onViewDetail: (log: AuditLogEntry) => void;
  getActionIcon: (action: AuditAction) => ReactNode;
  getActionBadge: (action: AuditAction) => 'success' | 'warning' | 'destructive' | 'secondary' | 'default';
}

export interface LogDetailDialogProps {
  open: boolean;
  onClose: () => void;
  log: AuditLogEntry | null;
}
