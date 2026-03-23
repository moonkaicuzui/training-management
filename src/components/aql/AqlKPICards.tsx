import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardCheck, AlertTriangle, Users, XCircle, Loader2 } from 'lucide-react';
import type { AqlProcessedData } from '@/types/aql';

interface Props {
  stats: AqlProcessedData['stats'] | null;
  isLoading: boolean;
}

export function AqlKPICards({ stats, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      title: t('aql.dashboard.totalInspections', 'Total Inspections'),
      value: stats.total.toLocaleString(),
      icon: ClipboardCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('aql.dashboard.failRate', 'Fail Rate'),
      value: `${stats.fail_rate}%`,
      icon: AlertTriangle,
      color: stats.fail_rate > 30
        ? 'text-red-600'
        : stats.fail_rate > 10
          ? 'text-orange-500'
          : stats.fail_rate > 0
            ? 'text-yellow-600'
            : 'text-green-600',
      bgColor: stats.fail_rate > 30
        ? 'bg-red-50'
        : stats.fail_rate > 10
          ? 'bg-orange-50'
          : stats.fail_rate > 0
            ? 'bg-yellow-50'
            : 'bg-green-50',
    },
    {
      title: t('aql.dashboard.failingInspectors', 'Failing TQC/RQC Inspectors'),
      value: String(stats.failing_inspectors),
      icon: Users,
      color: stats.failing_inspectors > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: stats.failing_inspectors > 0 ? 'bg-red-50' : 'bg-green-50',
    },
    {
      title: t('aql.dashboard.totalFails', 'Total Fails'),
      value: stats.fail.toLocaleString(),
      icon: XCircle,
      color: stats.fail > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: stats.fail > 0 ? 'bg-red-50' : 'bg-green-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
