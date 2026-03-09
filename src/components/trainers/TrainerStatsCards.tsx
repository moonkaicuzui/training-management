import { useTranslation } from 'react-i18next';
import { Users, Building2, Briefcase, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TrainerStats {
  total: number;
  internal: number;
  external: number;
  active: number;
}

interface TrainerStatsCardsProps {
  stats: TrainerStats;
}

export default function TrainerStatsCards({ stats }: TrainerStatsCardsProps) {
  const { t } = useTranslation();

  const cards = [
    {
      icon: Users,
      value: stats.total,
      label: t('trainers.totalTrainers'),
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Building2,
      value: stats.internal,
      label: t('trainers.internalTrainers'),
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: Briefcase,
      value: stats.external,
      label: t('trainers.externalTrainers'),
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      icon: Star,
      value: stats.active,
      label: t('trainers.activeTrainers'),
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${card.bgColor} rounded-lg`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
