import { useTranslation } from 'react-i18next';
import type { TrainingEvaluation } from '@/services/evaluationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Star, Calendar } from 'lucide-react';

interface EvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
}

const evaluationCriteria: EvaluationCriteria[] = [
  { id: 'c1', name: '교육 내용 적합성', weight: 20, description: '업무와의 관련성 및 실용성' },
  { id: 'c2', name: '강사 전문성', weight: 20, description: '강사의 지식과 전달력' },
  { id: 'c3', name: '교육 자료 품질', weight: 15, description: '교재 및 자료의 품질' },
  { id: 'c4', name: '교육 환경', weight: 10, description: '시설 및 장비 상태' },
  { id: 'c5', name: '학습 목표 달성', weight: 20, description: '교육 목표 달성 정도' },
  { id: 'c6', name: '업무 적용 가능성', weight: 15, description: '실제 업무 적용 가능성' },
];

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

// ─── Detail Dialog ───────────────────────────────────────────

interface EvaluationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: TrainingEvaluation | null;
}

export function EvaluationDetailDialog({
  open,
  onOpenChange,
  evaluation,
}: EvaluationDetailDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('evaluation.detailTitle')}</DialogTitle>
          <DialogDescription>
            {evaluation?.programName} - {evaluation?.employeeName}
          </DialogDescription>
        </DialogHeader>
        {evaluation && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">{t('evaluation.programLabel')}</Label>
                <p className="font-medium">{evaluation.programName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('evaluation.trainingDateLabel')}</Label>
                <p className="font-medium">{evaluation.sessionDate}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('evaluation.participantLabel')}</Label>
                <p className="font-medium">{evaluation.employeeName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('evaluation.departmentLabel')}</Label>
                <p className="font-medium">{evaluation.department}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('evaluation.typeLabel')}</Label>
                <Badge variant={getTypeBadgeVariant(evaluation.evaluationType)}>
                  {getTypeLabel(evaluation.evaluationType, t)}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('evaluation.statusLabel')}</Label>
                <Badge variant={getStatusBadgeVariant(evaluation.status)}>
                  {getStatusLabel(evaluation.status, t)}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground mb-2 block">{t('evaluation.responsesLabel')}</Label>
              <div className="space-y-3">
                {evaluation.responses.map((response) => {
                  const criteria = evaluationCriteria.find(c => c.id === response.criteriaId);
                  return (
                    <div key={response.criteriaId} className="flex items-center justify-between border-b pb-2">
                      <span>{criteria?.name}</span>
                      {renderStars(response.score)}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">{t('evaluation.overallScore')}</Label>
              <div className="mt-2">
                {renderStars(evaluation.overallScore)}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">{t('evaluation.feedbackLabel')}</Label>
              <p className="mt-1 p-3 bg-muted rounded-lg">
                {evaluation.feedback}
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Evaluation Dialog ──────────────────────────────────

interface NewEvaluationForm {
  programCode: string;
  type: string;
  sessionId: string;
  deadline: string;
  message: string;
}

interface NewEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: NewEvaluationForm;
  onFormChange: (form: NewEvaluationForm) => void;
  onSubmit: () => void;
  isCreating: boolean;
}

export function NewEvaluationDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isCreating,
}: NewEvaluationDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('evaluation.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('evaluation.createDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('evaluation.selectProgram')}</Label>
              <Select
                value={form.programCode}
                onValueChange={(v) => onFormChange({ ...form, programCode: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('evaluation.selectProgram')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prg1">품질관리 기초</SelectItem>
                  <SelectItem value="prg2">안전교육 정기</SelectItem>
                  <SelectItem value="prg3">리더십 향상</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('evaluation.typeLabel')}</Label>
              <Select
                value={form.type}
                onValueChange={(v) => onFormChange({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('evaluation.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reaction">{t('evaluation.typeReaction')}</SelectItem>
                  <SelectItem value="learning">{t('evaluation.typeLearning')}</SelectItem>
                  <SelectItem value="behavior">{t('evaluation.typeBehavior')}</SelectItem>
                  <SelectItem value="results">{t('evaluation.typeResults')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>
              <Calendar className="inline h-4 w-4 mr-1" />
              {t('evaluation.deadline')}
            </Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => onFormChange({ ...form, deadline: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('evaluation.message')}</Label>
            <Textarea
              placeholder={t('evaluation.messagePlaceholder')}
              rows={3}
              value={form.message}
              onChange={(e) => onFormChange({ ...form, message: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={isCreating}>
            {isCreating ? t('common.creating', '생성 중...') : t('evaluation.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
