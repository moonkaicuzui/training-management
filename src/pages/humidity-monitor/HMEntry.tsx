/**
 * HMEntry — 온도-습도 모니터링 장치 점검 입력 페이지
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CalendarDays, AlertCircle, CheckCircle2, Thermometer } from 'lucide-react';
import { useHMMonitorStore } from '@/stores/hmMonitorStore';
import HMBatchEntryForm from '@/components/humidity-monitor/HMBatchEntryForm';
import type { HMCheckResult } from '@/types/humidityMonitor';
import { calculateCheckResult } from '@/services/hmMonitor/helpers';

export default function HMEntry() {
  const { t } = useTranslation();
  const {
    devices, inspections, isLoading, error,
    fetchDevices, fetchInspections, createInspection, updateInspection,
  } = useHMMonitorStore(useShallow((s) => ({
    devices: s.devices, inspections: s.inspections, isLoading: s.isLoading, error: s.error,
    fetchDevices: s.fetchDevices, fetchInspections: s.fetchInspections,
    createInspection: s.createInspection, updateInspection: s.updateInspection,
  })));

  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [inspector, setInspector] = useState('Vo Thi Thuy Linh');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const existingInspection = useMemo(
    () => inspections.find((i) => i.inspectionDate === dateStr),
    [inspections, dateStr],
  );
  const isEditMode = !!existingInspection;

  const defaultResults = useMemo<HMCheckResult[] | undefined>(
    () => existingInspection?.results,
    [existingInspection],
  );

  useEffect(() => { fetchDevices(); fetchInspections(); }, [fetchDevices, fetchInspections]);
  useEffect(() => {
    if (existingInspection) setInspector(existingInspection.inspector || 'Vo Thi Thuy Linh');
  }, [existingInspection]);

  const handleSubmit = useCallback(async (results: HMCheckResult[]) => {
    if (!inspector.trim()) return;
    setIsSubmitting(true);
    setSubmitSuccess(false);
    try {
      const finalResults = results.map((r) => {
        const calc = calculateCheckResult(r.okCount, r.noOkCount, r.targetQuantity);
        return { ...r, ...calc };
      });
      if (isEditMode && existingInspection?.id) {
        await updateInspection(existingInspection.id, finalResults, inspector.trim());
      } else {
        await createInspection(dateStr, inspector.trim(), finalResults);
      }
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch {
      // store handles error
    } finally {
      setIsSubmitting(false);
    }
  }, [inspector, dateStr, isEditMode, existingInspection, createInspection, updateInspection]);

  if (isLoading && devices.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Thermometer className="h-6 w-6" />{t('humidityMonitor.entry.title')}
        </h1>
        <p className="text-muted-foreground">{t('humidityMonitor.entry.description')}</p>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {submitSuccess && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">{t('humidityMonitor.entry.saveSuccess')}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />{t('humidityMonitor.entry.inspectionDate')}
            {isEditMode && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                {t('humidityMonitor.entry.existingData')}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{t('humidityMonitor.entry.inspectionDate')}</Label>
              <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="w-[200px]" />
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">{t('humidityMonitor.entry.inspector')}</Label>
              <Input value={inspector} onChange={(e) => setInspector(e.target.value)} placeholder={t('humidityMonitor.entry.enterInspector')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <HMBatchEntryForm devices={devices} defaultResults={defaultResults} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
