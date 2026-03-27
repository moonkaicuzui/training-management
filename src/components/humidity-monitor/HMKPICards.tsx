/**
 * 온도-습도 모니터링 KPI 카드
 * 4개 KPI: 총 장치, 정상 OK, 비정상 NO OK, 부족
 */

import { useTranslation } from 'react-i18next';
import { Activity, CheckCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HMDashboardKPI } from '@/types/humidityMonitor';

interface HMKPICardsProps {
  kpi: HMDashboardKPI | null;
}

export default function HMKPICards({ kpi }: HMKPICardsProps) {
  const { t } = useTranslation();

  const cards = [
    {
      title: t('humidityMonitor.kpi.totalTarget'),
      value: kpi?.totalTarget ?? 0,
      subtitle: t('humidityMonitor.kpi.units'),
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('humidityMonitor.kpi.totalOk'),
      value: kpi?.totalOk ?? 0,
      subtitle: `${kpi?.okRate?.toFixed(1) ?? 0}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: t('humidityMonitor.kpi.totalNoOk'),
      value: kpi?.totalNoOk ?? 0,
      subtitle: t('humidityMonitor.kpi.units'),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: t('humidityMonitor.kpi.totalMissing'),
      value: kpi?.totalMissing ?? 0,
      subtitle: t('humidityMonitor.kpi.units'),
      icon: MinusCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                  {card.title}
                </CardTitle>
                <div className={`rounded-md p-1.5 ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold sm:text-2xl">{card.value}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">{card.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {kpi?.lastInspectionDate && (
        <p className="text-xs text-muted-foreground text-right">
          {t('humidityMonitor.kpi.lastInspection')}: {kpi.lastInspectionDate}
        </p>
      )}
    </div>
  );
}
