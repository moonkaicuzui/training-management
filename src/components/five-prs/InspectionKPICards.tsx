import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardCheck, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import type { ProcessedStats } from '@/types/fivePrs';

interface Props {
  stats: ProcessedStats;
}

export function InspectionKPICards({ stats }: Props) {
  const { t } = useTranslation();

  const cards = [
    {
      title: t('fivePrs.totalValidation'),
      value: stats.totalValidation.toLocaleString(),
      icon: ClipboardCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('fivePrs.rejectRate'),
      value: `${stats.totalRejectRate}%`,
      icon: AlertTriangle,
      color: stats.totalRejectRate > 3 ? 'text-red-600' : stats.totalRejectRate > 1.5 ? 'text-yellow-600' : 'text-green-600',
      bgColor: stats.totalRejectRate > 3 ? 'bg-red-50' : stats.totalRejectRate > 1.5 ? 'bg-yellow-50' : 'bg-green-50',
    },
    {
      title: t('fivePrs.highRiskTqc'),
      value: String(stats.highRiskTqcCount),
      icon: Users,
      color: stats.highRiskTqcCount > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: stats.highRiskTqcCount > 0 ? 'bg-red-50' : 'bg-green-50',
    },
    {
      title: t('fivePrs.avgDailyValidation'),
      value: stats.avgDailyValidation.toLocaleString(),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
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
