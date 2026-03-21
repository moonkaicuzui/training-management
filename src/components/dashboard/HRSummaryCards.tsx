/**
 * HR V2 인사 요약 카드
 * 메인 대시보드에 HR 실시간 데이터를 표시하는 컴포넌트
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserCheck,
  UserMinus,
  UserPlus,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { HRSummary } from '@/services/hrIntegrationService';

interface HRSummaryCardsProps {
  hrData: HRSummary | null;
  isLoading: boolean;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const HRSummaryCards = memo(function HRSummaryCards({
  hrData,
  isLoading,
  onSync,
  isSyncing,
}: HRSummaryCardsProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-4 w-4 mx-auto mb-2" />
                <Skeleton className="h-3 w-16 mx-auto mb-1" />
                <Skeleton className="h-7 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hrData) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex items-center justify-center py-4 gap-3">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t('dashboard.hr.notSynced')}
          </p>
          {onSync && (
            <Button
              variant="default"
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {t('dashboard.hr.syncNow')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const cards = [
    {
      label: t('dashboard.hr.activeHeadcount'),
      value: hrData.activeHeadcount.toLocaleString(),
      icon: UserCheck,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: t('dashboard.hr.attendanceRate'),
      value: `${hrData.attendanceRate.toFixed(1)}%`,
      icon: Clock,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      badge: hrData.attendanceRate >= 95
        ? { label: t('dashboard.hr.good'), variant: 'default' as const }
        : hrData.attendanceRate >= 90
          ? { label: t('dashboard.hr.warning'), variant: 'secondary' as const }
          : { label: t('dashboard.hr.critical'), variant: 'destructive' as const },
    },
    {
      label: t('dashboard.hr.turnoverRate'),
      value: `${hrData.turnoverRate.toFixed(1)}%`,
      icon: UserMinus,
      iconColor: hrData.turnoverRate > 5 ? 'text-red-500' : 'text-orange-500',
      bgColor: hrData.turnoverRate > 5
        ? 'bg-red-50 dark:bg-red-950/30'
        : 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      label: t('dashboard.hr.newHires'),
      value: hrData.newHires.toLocaleString(),
      icon: UserPlus,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: t('dashboard.hr.resignations'),
      value: hrData.resignations.toLocaleString(),
      icon: UserMinus,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
    },
    {
      label: t('dashboard.hr.avgTenure'),
      value: `${hrData.avgTenure.toFixed(1)}`,
      suffix: t('dashboard.hr.years'),
      icon: Clock,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {t('dashboard.hr.title')}
            {hrData.syncedAt && (
              <Badge variant="outline" className="text-xs font-normal">
                {t('dashboard.hr.lastSync')}: {new Date(hrData.syncedAt).toLocaleDateString()}
              </Badge>
            )}
          </CardTitle>
          {onSync && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
              title={t('dashboard.hr.syncTooltip')}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`text-center p-3 rounded-lg ${card.bgColor}`}
              >
                <Icon className={`h-4 w-4 mx-auto mb-1 ${card.iconColor}`} />
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold">
                  {card.value}
                  {card.suffix && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      {card.suffix}
                    </span>
                  )}
                </p>
                {card.badge && (
                  <Badge variant={card.badge.variant} className="text-[10px] mt-1 px-1.5 py-0">
                    {card.badge.label}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
