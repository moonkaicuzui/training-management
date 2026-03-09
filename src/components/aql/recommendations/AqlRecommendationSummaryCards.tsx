import { useTranslation } from 'react-i18next';
import { Users, XCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { RecommendationSummaryCards, type SummaryCardConfig } from '@/components/common/recommendations';
import type { AqlTrainingRecommendation } from '@/types/aql';

interface Props {
  recommendations: AqlTrainingRecommendation[];
}

export function AqlRecommendationSummaryCards({ recommendations }: Props) {
  const { t } = useTranslation();

  const inspectorFailCount = recommendations.filter(
    (r) => r.enrollment_reason === 'INSPECTOR_FAIL'
  ).length;
  const supervisorEscalationCount = recommendations.filter(
    (r) => r.enrollment_reason === 'SUPERVISOR_ESCALATION'
  ).length;
  const enrolledCount = recommendations.filter(
    (r) => r.enrollment_status === 'ENROLLED'
  ).length;

  const cards: SummaryCardConfig[] = [
    {
      title: t('aql.recommendations.totalRecommendations', 'Total Recommendations'),
      value: recommendations.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('aql.recommendations.inspectorFail', 'Inspector Fail'),
      value: inspectorFailCount,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: t('aql.recommendations.supervisorEscalation', 'Supervisor Escalation'),
      value: supervisorEscalationCount,
      icon: AlertTriangle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: t('aql.recommendations.enrolled', 'Enrolled'),
      value: enrolledCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return <RecommendationSummaryCards cards={cards} />;
}
