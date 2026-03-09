import { useTranslation } from 'react-i18next';
import { History, Loader2, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import type { TrainingResult } from '@/types';
import { format } from 'date-fns';

export interface EditingResultState {
  result_id: string;
  score: number | null;
  result: 'PASS' | 'FAIL' | 'ABSENT';
  remarks: string;
  editReason: string;
}

interface ResultEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingResult: EditingResultState | null;
  onEditingResultChange: (result: EditingResultState | null) => void;
  onSave: () => void;
  isSubmitting: boolean;
}

export function ResultEditDialog({
  open,
  onOpenChange,
  editingResult,
  onEditingResultChange,
  onSave,
  isSubmitting,
}: ResultEditDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('results.editTitle')}</DialogTitle>
          <DialogDescription>
            {t('results.editDescription')}
          </DialogDescription>
        </DialogHeader>
        {editingResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('training.score')}</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editingResult.score ?? ''}
                  onChange={(e) =>
                    onEditingResultChange({
                      ...editingResult,
                      score: e.target.value === '' ? null : parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('training.result')}</Label>
                <Select
                  value={editingResult.result}
                  onValueChange={(value) =>
                    onEditingResultChange({
                      ...editingResult,
                      result: value as TrainingResult,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASS">{t('training.pass')}</SelectItem>
                    <SelectItem value="FAIL">{t('training.fail')}</SelectItem>
                    <SelectItem value="ABSENT">{t('training.absent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('training.notes')}</Label>
              <Input
                value={editingResult.remarks}
                onChange={(e) =>
                  onEditingResultChange({
                    ...editingResult,
                    remarks: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-destructive">{t('results.editReasonLabel')}</Label>
              <Textarea
                value={editingResult.editReason}
                onChange={(e) =>
                  onEditingResultChange({
                    ...editingResult,
                    editReason: e.target.value,
                  })
                }
                placeholder={t('results.editReasonPlaceholder')}
                className="min-h-[80px]"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <History className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? t('common.saving') : t('results.saveEdit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Duplicate Warning Dialog
export interface DuplicateInfo {
  employee_id: string;
  employee_name: string;
  existingResult: {
    training_date: string;
    score: number | null;
    result: string;
    grade: string | null;
  };
}

interface DuplicateWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateInfo[];
  pendingCount: number;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  duplicates,
  pendingCount,
  isSubmitting,
  onConfirm,
}: DuplicateWarningDialogProps) {
  const { t } = useTranslation();
  const saveCount = pendingCount - duplicates.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            {t('results.duplicateDetected')}
          </DialogTitle>
          <DialogDescription>
            {t('results.duplicateDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {duplicates.map((dup) => (
            <div
              key={dup.employee_id}
              className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <div className="font-medium text-amber-800">
                {dup.employee_name} ({dup.employee_id})
              </div>
              <div className="text-sm text-amber-700 mt-1">
                {t('results.existingResult')}: {format(new Date(dup.existingResult.training_date), 'yyyy-MM-dd')} |{' '}
                {dup.existingResult.score !== null ? t('results.scoreWithUnit', { score: dup.existingResult.score }) : '-'} |{' '}
                {dup.existingResult.result === 'PASS'
                  ? t('training.pass')
                  : dup.existingResult.result === 'FAIL'
                  ? t('training.fail')
                  : t('training.absent')}
                {dup.existingResult.grade && ` | ${dup.existingResult.grade} ${t('results.gradeUnit')}`}
              </div>
            </div>
          ))}
        </div>

        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          <p>
            {t('results.duplicateExplanation', { duplicateCount: duplicates.length, saveCount })}
          </p>
          <p className="mt-1">
            {t('results.duplicateEditHint')}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={saveCount === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? t('common.saving') : t('results.saveExcludingDuplicates', { count: saveCount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
