/**
 * EmployeeSyncStatus - Displays Google Sheets sync status and provides manual sync trigger.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, CheckCircle2, AlertCircle, Clock, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUIStore } from '@/stores/uiStore';

interface SyncStatusData {
  status: 'NOT_SYNCED' | 'SYNCED' | 'ERROR';
  last_sync_at?: string | null;
  sync_type?: string;
  sheet_to_firestore?: { created: number; updated: number };
  firestore_to_sheet?: { appended: number };
  total_sheet_employees?: number;
  total_firestore_employees?: number;
  message?: string;
}

export function EmployeeSyncStatus() {
  const { t } = useTranslation();
  const addToast = useUIStore((s) => s.addToast);
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employee-sync/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSyncStatus(data);
    } catch {
      setSyncStatus({ status: 'ERROR', message: 'Failed to fetch sync status' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleFullSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/employee-sync/full-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const result = await res.json();
      addToast({
        type: 'success',
        title: t('employee.syncSuccess', {
          created: result.sheet_to_firestore?.created || 0,
          updated: result.sheet_to_firestore?.updated || 0,
        }),
      });
      // Refresh status
      await fetchStatus();
    } catch (err) {
      addToast({
        type: 'error',
        title: t('employee.syncError'),
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSyncing(false);
    }
  }, [addToast, t, fetchStatus]);

  const formatLastSync = (dateStr: string | null | undefined) => {
    if (!dateStr) return t('employee.syncNever');
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return t('employee.syncJustNow');
      if (diffMins < 60) return t('employee.syncMinutesAgo', { count: diffMins });
      if (diffHours < 24) return t('employee.syncHoursAgo', { count: diffHours });
      return t('employee.syncDaysAgo', { count: diffDays });
    } catch {
      return dateStr;
    }
  };

  const getStatusIcon = () => {
    if (loading) return <Clock className="h-4 w-4 animate-pulse text-muted-foreground" />;
    if (!syncStatus || syncStatus.status === 'NOT_SYNCED')
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    if (syncStatus.status === 'ERROR')
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const getStatusBadge = () => {
    if (!syncStatus || syncStatus.status === 'NOT_SYNCED')
      return <Badge variant="outline" className="text-yellow-600 border-yellow-300">{t('employee.syncNotSynced')}</Badge>;
    if (syncStatus.status === 'ERROR')
      return <Badge variant="destructive">{t('employee.syncError')}</Badge>;
    return <Badge variant="outline" className="text-green-600 border-green-300">{t('employee.syncConnected')}</Badge>;
  };

  return (
    <div className="flex items-center gap-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cloud className="h-4 w-4" />
              {getStatusIcon()}
              {getStatusBadge()}
              {syncStatus?.last_sync_at && (
                <span className="hidden sm:inline text-xs">
                  {formatLastSync(syncStatus.last_sync_at)}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{t('employee.syncTooltipTitle')}</p>
            {syncStatus?.last_sync_at && (
              <p className="text-xs">
                {t('employee.syncLastSync')}: {new Date(syncStatus.last_sync_at).toLocaleString()}
              </p>
            )}
            {syncStatus?.total_sheet_employees != null && (
              <p className="text-xs">
                {t('employee.syncSheetCount', { count: syncStatus.total_sheet_employees })} | {t('employee.syncFirestoreCount', { count: syncStatus.total_firestore_employees })}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button
        variant="outline"
        size="sm"
        onClick={handleFullSync}
        disabled={syncing || loading}
      >
        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? t('employee.syncing') : t('employee.syncNow')}
      </Button>
    </div>
  );
}
