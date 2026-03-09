import { useTranslation } from 'react-i18next';
import type { TrainingEvaluation } from '@/services/evaluationService';
import type { ProgramStats } from './types';
import { renderStars } from './helpers';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Target,
  Award,
  MessageSquare,
} from 'lucide-react';

interface OverviewTabProps {
  evaluations: TrainingEvaluation[];
  programStats: ProgramStats[];
}

export function OverviewTab({ evaluations, programStats }: OverviewTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Kirkpatrick Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('evaluation.kirkpatrickTitle')}
            </CardTitle>
            <CardDescription>
              {t('evaluation.kirkpatrickDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {([
                { type: 'reaction', icon: <ThumbsUp className="h-4 w-4 text-blue-500" />, label: t('evaluation.level1') },
                { type: 'learning', icon: <BarChart3 className="h-4 w-4 text-green-500" />, label: t('evaluation.level2') },
                { type: 'behavior', icon: <TrendingUp className="h-4 w-4 text-yellow-500" />, label: t('evaluation.level3') },
                { type: 'results', icon: <Award className="h-4 w-4 text-purple-500" />, label: t('evaluation.level4') },
              ] as const).map(level => {
                const levelEvals = evaluations.filter(e => e.evaluationType === level.type);
                const levelAvg = levelEvals.length > 0
                  ? levelEvals.reduce((sum, e) => sum + e.overallScore, 0) / levelEvals.length
                  : 0;
                return (
                  <div key={level.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {level.icon}
                      <span>{level.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{levelAvg > 0 ? levelAvg.toFixed(1) : '-'}</span>
                      <Progress value={levelAvg > 0 ? (levelAvg / 5) * 100 : 0} className="w-20" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Evaluations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('evaluation.recentEvaluations')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluations.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{e.programName}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.employeeName} · {e.department}
                    </p>
                  </div>
                  <div className="text-right">
                    {renderStars(e.overallScore)}
                    <p className="text-xs text-muted-foreground">
                      {e.submittedAt.split('T')[0]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top/Bottom Programs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              {t('evaluation.topPrograms')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {programStats
                .sort((a, b) => b.averageScore - a.averageScore)
                .slice(0, 3)
                .map((p, idx) => (
                  <div key={p.programId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{idx + 1}</span>
                      <span>{p.programName}</span>
                    </div>
                    {renderStars(p.averageScore)}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-500" />
              {t('evaluation.needsImprovement')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {programStats
                .sort((a, b) => a.averageScore - b.averageScore)
                .slice(0, 3)
                .map((p, idx) => (
                  <div key={p.programId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{idx + 1}</span>
                      <span>{p.programName}</span>
                    </div>
                    {renderStars(p.averageScore)}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
