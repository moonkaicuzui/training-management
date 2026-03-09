import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, TrendingUp, Users, FileText } from 'lucide-react';
import { getScoreColor } from './helpers';

interface EvaluationStatsCardsProps {
  totalEvaluations: number;
  submittedCount: number;
  averageScore: number;
  pendingCount: number;
}

export function EvaluationStatsCards({
  totalEvaluations,
  submittedCount,
  averageScore,
  pendingCount,
}: EvaluationStatsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('evaluation.totalEvaluations')}</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEvaluations}</div>
          <p className="text-xs text-muted-foreground">
            {t('evaluation.submittedCount', { count: submittedCount })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('evaluation.avgScore')}</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
            {averageScore.toFixed(1)} / 5.0
          </div>
          <Progress value={(averageScore / 5) * 100} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('evaluation.responseRate')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalEvaluations > 0 ? Math.round((submittedCount / totalEvaluations) * 100) : 0}%
          </div>
          <Progress
            value={totalEvaluations > 0 ? (submittedCount / totalEvaluations) * 100 : 0}
            className="mt-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('evaluation.pending')}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
          <p className="text-xs text-muted-foreground">
            {t('evaluation.pendingCount')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
