import { useTranslation } from 'react-i18next';
import { UserPlus, UserMinus, ArrowRightLeft, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { HRChangeEvent, HRSyncResult } from '@/services/api';

interface HRSyncResultCardsProps {
  syncResult: HRSyncResult | null;
  error: string | null;
  events: HRChangeEvent[];
}

export default function HRSyncResultCards({ syncResult, error, events }: HRSyncResultCardsProps) {
  const { t } = useTranslation();

  const newHires = events.filter((e) => e.type === 'NEW_HIRE');
  const resignations = events.filter((e) => e.type === 'RESIGNATION');
  const deptChanges = events.filter((e) => e.type === 'DEPARTMENT_CHANGE');
  const bldgChanges = events.filter((e) => e.type === 'BUILDING_CHANGE');

  return (
    <>
      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Result */}
      {syncResult && (
        <Card className="border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600 mb-3">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{t('hrSync.syncCompleteTitle')}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('hrSync.totalHR')}</span>
                <p className="font-semibold text-lg">{syncResult.totalHREmployees}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('hrSync.updated')}</span>
                <p className="font-semibold text-lg">{syncResult.updatedCount}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('hrSync.errorsCount')}</span>
                <p className="font-semibold text-lg">{syncResult.errors.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('hrSync.syncTime')}</span>
                <p className="font-semibold text-sm">{syncResult.syncedAt}</p>
              </div>
            </div>
            {syncResult.errors.length > 0 && (
              <div className="mt-3 p-3 bg-destructive/10 rounded text-sm text-destructive">
                {syncResult.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Summary Cards */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">{t('hrSync.eventType.newHire')}</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{newHires.length}{t('hrSync.count')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <UserMinus className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">{t('hrSync.eventType.resignation')}</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{resignations.length}{t('hrSync.count')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">{t('hrSync.eventType.departmentChange')}</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{deptChanges.length}{t('hrSync.count')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">{t('hrSync.eventType.buildingChange')}</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{bldgChanges.length}{t('hrSync.count')}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
