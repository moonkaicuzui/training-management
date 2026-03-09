import { useTranslation } from 'react-i18next';
import type { TrainingEvaluation } from '@/services/evaluationService';
import type { EvaluationCriteria } from './types';
import { renderStars } from './helpers';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

function getEvaluationCriteria(t: (key: string) => string): EvaluationCriteria[] {
  return [
    { id: 'c1', name: t('evaluation.criteria.contentRelevance'), weight: 20, description: t('evaluation.criteria.contentRelevanceDesc') },
    { id: 'c2', name: t('evaluation.criteria.instructorExpertise'), weight: 20, description: t('evaluation.criteria.instructorExpertiseDesc') },
    { id: 'c3', name: t('evaluation.criteria.materialQuality'), weight: 15, description: t('evaluation.criteria.materialQualityDesc') },
    { id: 'c4', name: t('evaluation.criteria.environment'), weight: 10, description: t('evaluation.criteria.environmentDesc') },
    { id: 'c5', name: t('evaluation.criteria.goalAchievement'), weight: 20, description: t('evaluation.criteria.goalAchievementDesc') },
    { id: 'c6', name: t('evaluation.criteria.applicability'), weight: 15, description: t('evaluation.criteria.applicabilityDesc') },
  ];
}

interface CriteriaTabProps {
  evaluations: TrainingEvaluation[];
}

export function CriteriaTab({ evaluations }: CriteriaTabProps) {
  const { t } = useTranslation();
  const evaluationCriteria = getEvaluationCriteria(t);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('evaluation.criteriaManagement')}</CardTitle>
        <CardDescription>
          {t('evaluation.criteriaManagementDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('evaluation.criteriaItem')}</TableHead>
              <TableHead>{t('evaluation.criteriaDescription')}</TableHead>
              <TableHead>{t('evaluation.criteriaWeight')}</TableHead>
              <TableHead>{t('evaluation.criteriaAvgScore')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluationCriteria.map((criteria) => {
              const criteriaScores = evaluations
                .flatMap(e => e.responses || [])
                .filter(r => r.criteriaId === criteria.id)
                .map(r => r.score);
              const avgScore = criteriaScores.length > 0
                ? criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length
                : 0;
              return (
                <TableRow key={criteria.id}>
                  <TableCell className="font-medium">{criteria.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {criteria.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={criteria.weight} className="w-20" />
                      <span>{criteria.weight}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{avgScore > 0 ? renderStars(avgScore) : <span className="text-muted-foreground">-</span>}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
