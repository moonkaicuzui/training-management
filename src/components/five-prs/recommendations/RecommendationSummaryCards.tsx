import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Shield, TrendingUp, Users } from 'lucide-react';
import type { TrainingRecommendation } from '@/types/recommendation';

interface Props {
  recommendations: TrainingRecommendation[];
}

export function RecommendationSummaryCards({ recommendations }: Props) {
  const { t } = useTranslation();

  const immediateCount = recommendations.filter(
    (r) => r.priority === 'IMMEDIATE'
  ).length;
  const preventiveCount = recommendations.filter(
    (r) => r.priority === 'PREVENTIVE'
  ).length;
  const surgeCount = recommendations.filter(
    (r) => r.priority === 'SURGE'
  ).length;

  const cards = [
    {
      title: t('recommendation.totalRecommendations'),
      value: recommendations.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('recommendation.immediate'),
      value: immediateCount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: t('recommendation.preventive'),
      value: preventiveCount,
      icon: Shield,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: t('recommendation.surge'),
      value: surgeCount,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
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
                <p className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
