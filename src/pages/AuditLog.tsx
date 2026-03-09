import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { subDays } from 'date-fns';
import {
  Download,
  Edit,
  Trash2,
  Plus,
  Eye,
  RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AuditLogStatsCards,
  AuditLogFilters,
  AuditLogTable,
  LogDetailDialog,
} from '@/components/audit-log';
import type { AuditLogEntry, AuditAction } from '@/types/auditLog';
import * as api from '@/services/api';

export default function AuditLogPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLogs = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const cutoffDate = subDays(new Date(), periodDays);

    return logs.filter((log) => {
      const matchesSearch =
        log.log_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.changed_by.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEntityType = selectedEntityType === 'all' || log.entity_type === selectedEntityType;
      const matchesAction = selectedAction === 'all' || log.action === selectedAction;
      const matchesPeriod = new Date(log.changed_at) >= cutoffDate;

      return matchesSearch && matchesEntityType && matchesAction && matchesPeriod;
    });
  }, [logs, searchQuery, selectedEntityType, selectedAction, selectedPeriod]);

  const stats = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const cutoffDate = subDays(new Date(), periodDays);
    const periodLogs = logs.filter(log => new Date(log.changed_at) >= cutoffDate);

    return {
      total: periodLogs.length,
      creates: periodLogs.filter(l => l.action === 'CREATE').length,
      updates: periodLogs.filter(l => l.action === 'UPDATE').length,
      deletes: periodLogs.filter(l => l.action === 'DELETE').length,
      uniqueUsers: new Set(periodLogs.map(l => l.changed_by)).size,
    };
  }, [logs, selectedPeriod]);

  const handleViewDetail = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'VIEW':
        return <Eye className="h-4 w-4 text-gray-500" />;
      case 'EXPORT':
        return <Download className="h-4 w-4 text-purple-500" />;
      default:
        return <RefreshCcw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadge = (action: AuditAction): 'success' | 'warning' | 'destructive' | 'secondary' | 'default' => {
    const variants: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'default'> = {
      CREATE: 'success',
      UPDATE: 'warning',
      DELETE: 'destructive',
      VIEW: 'secondary',
      EXPORT: 'default',
      LOGIN: 'default',
      LOGOUT: 'secondary',
    };
    return variants[action] || 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('auditLog.title')}</h1>
          <p className="text-muted-foreground">{t('auditLog.description')}</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('auditLog.exportLogs')}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadData}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      <AuditLogStatsCards stats={stats} />

      <AuditLogFilters
        searchQuery={searchQuery}
        selectedEntityType={selectedEntityType}
        selectedAction={selectedAction}
        selectedPeriod={selectedPeriod}
        onSearchChange={setSearchQuery}
        onEntityTypeChange={setSelectedEntityType}
        onActionChange={setSelectedAction}
        onPeriodChange={setSelectedPeriod}
      />

      <AuditLogTable
        logs={filteredLogs}
        onViewDetail={handleViewDetail}
        getActionIcon={getActionIcon}
        getActionBadge={getActionBadge}
      />

      <LogDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        log={selectedLog}
      />
    </div>
  );
}
