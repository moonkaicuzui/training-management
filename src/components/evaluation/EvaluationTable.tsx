import { useTranslation } from 'react-i18next';
import type { TrainingEvaluation } from '@/services/evaluationService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Star, Eye } from 'lucide-react';

interface EvaluationTableProps {
  evaluations: TrainingEvaluation[];
  onViewDetails: (evaluation: TrainingEvaluation) => void;
}

function getTypeLabel(type: TrainingEvaluation['evaluationType'], t: (key: string) => string) {
  const labels: Record<string, string> = {
    reaction: t('evaluation.typeReaction'),
    learning: t('evaluation.typeLearning'),
    behavior: t('evaluation.typeBehavior'),
    results: t('evaluation.typeResults'),
  };
  return labels[type];
}

function getTypeBadgeVariant(type: TrainingEvaluation['evaluationType']) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    reaction: 'default',
    learning: 'secondary',
    behavior: 'outline',
    results: 'destructive',
  };
  return variants[type] || 'default';
}

function getStatusLabel(status: TrainingEvaluation['status'], t: (key: string) => string) {
  const labels: Record<string, string> = {
    pending: t('evaluation.statusPending'),
    submitted: t('evaluation.statusSubmitted'),
    reviewed: t('evaluation.statusReviewed'),
  };
  return labels[status];
}

function getStatusBadgeVariant(status: TrainingEvaluation['status']) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    submitted: 'secondary',
    reviewed: 'default',
  };
  return variants[status] || 'default';
}

function getScoreColor(score: number) {
  if (score >= 4.5) return 'text-green-600';
  if (score >= 3.5) return 'text-blue-600';
  if (score >= 2.5) return 'text-yellow-600';
  return 'text-red-600';
}

function renderStars(score: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
      <span className={`ml-2 font-medium ${getScoreColor(score)}`}>{score.toFixed(1)}</span>
    </div>
  );
}

export default function EvaluationTable({ evaluations, onViewDetails }: EvaluationTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('evaluation.programCol')}</TableHead>
              <TableHead>{t('evaluation.participantCol')}</TableHead>
              <TableHead>{t('evaluation.departmentCol')}</TableHead>
              <TableHead>{t('evaluation.typeCol')}</TableHead>
              <TableHead>{t('evaluation.scoreCol')}</TableHead>
              <TableHead>{t('evaluation.statusCol')}</TableHead>
              <TableHead>{t('evaluation.submittedDate')}</TableHead>
              <TableHead className="text-right">{t('evaluation.actionsCol')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.slice(0, 20).map((evaluation) => (
              <TableRow key={evaluation.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{evaluation.programName}</p>
                    <p className="text-sm text-muted-foreground">
                      {evaluation.sessionDate}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{evaluation.employeeName}</TableCell>
                <TableCell>{evaluation.department}</TableCell>
                <TableCell>
                  <Badge variant={getTypeBadgeVariant(evaluation.evaluationType)}>
                    {getTypeLabel(evaluation.evaluationType, t)}
                  </Badge>
                </TableCell>
                <TableCell>{renderStars(evaluation.overallScore)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(evaluation.status)}>
                    {getStatusLabel(evaluation.status, t)}
                  </Badge>
                </TableCell>
                <TableCell>{evaluation.submittedAt.split('T')[0]}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(evaluation)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
