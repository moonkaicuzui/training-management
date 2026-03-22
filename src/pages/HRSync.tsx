/**
 * HR V2 직원 데이터 동기화 페이지
 * 관리자 전용 페이지 (ADMIN role)
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { HRChangeEvent, HRSyncResult } from '@/services/api';
import { detectHRChanges, syncEmployeesFromHR, deactivateEmployee } from '@/services/api';
import HRSyncPeriodSelector from '@/components/hr/HRSyncPeriodSelector';
import HRSyncResultCards from '@/components/hr/HRSyncResultCards';
import HREventTable from '@/components/hr/HREventTable';

const MONTH_NAMES_EN = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const CURRENT_YEAR = new Date().getFullYear();

export default function HRSync() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(MONTH_NAMES_EN[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [events, setEvents] = useState<HRChangeEvent[]>([]);
  const [syncResult, setSyncResult] = useState<HRSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deactivatingIds, setDeactivatingIds] = useState<Set<string>>(new Set());

  const handleDetectChanges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEvents([]);
    setSyncResult(null);
    try {
      const detected = await detectHRChanges(selectedMonth, selectedYear);
      setEvents(detected);
      toast({
        title: detected.length === 0 ? t('hrSync.toast.noChanges') : t('hrSync.toast.changesDetected'),
        description: detected.length === 0 ? t('hrSync.toast.noChangesDesc') : t('hrSync.toast.changesDetectedDesc', { count: detected.length }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast({ title: t('hrSync.toast.error'), description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, toast, t]);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const result = await syncEmployeesFromHR(selectedMonth, selectedYear);
      setSyncResult(result);
      setEvents([...result.newEmployees, ...result.resignedEmployees, ...result.departmentChanges, ...result.buildingChanges]);
      toast({
        title: t('hrSync.toast.syncComplete'),
        description: t('hrSync.toast.syncCompleteDesc', { total: result.totalHREmployees, updated: result.updatedCount }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast({ title: t('hrSync.toast.error'), description: message, variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  }, [selectedMonth, selectedYear, toast, t]);

  const handleDeactivate = useCallback(async (employeeId: string) => {
    setDeactivatingIds((prev) => new Set(prev).add(employeeId));
    try {
      await deactivateEmployee(employeeId);
      toast({ title: t('hrSync.toast.deactivated'), description: t('hrSync.toast.deactivatedDesc', { id: employeeId }) });
      setEvents((prev) => prev.filter((e) => !(e.type === 'RESIGNATION' && e.employeeId === employeeId)));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t('hrSync.toast.error'), description: message, variant: 'destructive' });
    } finally {
      setDeactivatingIds((prev) => { const next = new Set(prev); next.delete(employeeId); return next; });
    }
  }, [toast, t]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('hrSync.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('hrSync.description')}</p>
      </div>

      <HRSyncPeriodSelector
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        isLoading={isLoading}
        isSyncing={isSyncing}
        onDetect={handleDetectChanges}
        onSync={handleSync}
      />

      <HRSyncResultCards syncResult={syncResult} error={error} events={events} />

      <HREventTable events={events} deactivatingIds={deactivatingIds} onDeactivate={handleDeactivate} />

      {/* Empty State */}
      {!isLoading && !isSyncing && events.length === 0 && !error && !syncResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium">{t('hrSync.empty.title')}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">{t('hrSync.empty.description')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
