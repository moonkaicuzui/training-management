import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Users, XCircle, AlertTriangle, CheckCircle } from 'lucide-react';
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

  const cards = [
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
