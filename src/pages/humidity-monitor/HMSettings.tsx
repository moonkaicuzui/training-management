/**
 * Humidity Monitor Settings
 * 35개 구역 마스터 등록/수정 + 초기 데이터 시드
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Settings, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useHMMonitorStore } from '@/stores/hmMonitorStore';
import HMDeviceSettings from '@/components/humidity-monitor/HMDeviceSettings';
import { HM_SEED_DEVICES } from '@/types/humidityMonitor';

export default function HMSettings() {
  const { t } = useTranslation();
  const {
    devices,
    isLoading,
    error,
    fetchDevices,
    seedDevices,
    updateDevice,
    deleteDevice,
  } = useHMMonitorStore(useShallow((s) => ({
    devices: s.devices,
    isLoading: s.isLoading,
    error: s.error,
    fetchDevices: s.fetchDevices,
    seedDevices: s.seedDevices,
    updateDevice: s.updateDevice,
    deleteDevice: s.deleteDevice,
  })));

  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleSeedDevices = async () => {
    setSeeding(true);
    setSeedSuccess(false);
    try {
      await seedDevices(HM_SEED_DEVICES);
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch {
      // error handled by store
    } finally {
      setSeeding(false);
    }
  };

  const hasDevices = devices.length > 0;

  if (isLoading && devices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          {t('humidityMonitor.settings.title')}
        </h1>
        <p className="text-muted-foreground">{t('humidityMonitor.settings.description')}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {seedSuccess && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {t('humidityMonitor.settings.seedSuccess')}
          </AlertDescription>
        </Alert>
      )}

      {/* Seed Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            {t('humidityMonitor.settings.seedButton')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSeedDevices}
              disabled={seeding || hasDevices}
              variant={hasDevices ? 'outline' : 'default'}
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              {t('humidityMonitor.settings.seedButton')}
            </Button>
            {hasDevices && (
              <span className="text-sm text-muted-foreground">
                {t('humidityMonitor.settings.seedDisabled')} ({devices.length})
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device Settings Table */}
      <HMDeviceSettings
        devices={devices}
        onSeed={handleSeedDevices}
        onUpdate={(id, data) => updateDevice(id, data)}
        onDelete={(id) => deleteDevice(id)}
        isSeedDisabled={hasDevices || seeding}
      />
    </div>
  );
}
