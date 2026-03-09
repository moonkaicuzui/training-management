import { useTranslation } from 'react-i18next';
import { AlertTriangle, Shield, TrendingUp, Users } from 'lucide-react';
import { RecommendationSummaryCards as CommonSummaryCards, type SummaryCardConfig } from '@/components/common/recommendations';
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

  const cards: SummaryCardConfig[] = [
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

  return <CommonSummaryCards cards={cards} />;
}

