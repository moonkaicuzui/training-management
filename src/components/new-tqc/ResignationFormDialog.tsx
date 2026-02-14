import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import type {
  NewTQCTrainee,
  NewTQCResignationInput,
  ResignationReason,
} from '@/types/newTqc';

const RESIGNATION_REASONS: ResignationReason[] = [
  'HEALTH_ISSUE',
  'FAMILY_MATTERS',
  'DISTANCE',
  'LOW_SALARY',
  'JOB_CHANGE',
  'ABSENCE',
  'ACCIDENT',
  'OTHER',
];

interface ResignationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewTQCResignationInput) => Promise<void>;
  trainees: NewTQCTrainee[]; // Only IN_TRAINING trainees should be passed
}

export function ResignationFormDialog({
  open,
  onClose,
  onSubmit,
  trainees,
}: ResignationFormDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<NewTQCResignationInput>({
    trainee_id: '',
    resign_date: new Date().toISOString().split('T')[0],
    reason_category: 'OTHER',
    reason_detail: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFormData({
        trainee_id: '',
        resign_date: new Date().toISOString().split('T')[0],
        reason_category: 'OTHER',
        reason_detail: '',
      });
      setErrors({});
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.trainee_id) {
      newErrors.trainee_id = t('newTqc.resignationForm.traineeRequired');
    }
    if (!formData.resign_date) {
      newErrors.resign_date = t('newTqc.resignationForm.dateRequired');
    }
    if (!formData.reason_category) {
      newErrors.reason_category = t('newTqc.resignationForm.reasonRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('newTqc.resignationForm.title')}</DialogTitle>
          <DialogDescription>
            {t('newTqc.resignationForm.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Trainee Selection */}
          <div className="space-y-2">
            <Label>
              {t('newTqc.resignationForm.selectTrainee')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.trainee_id}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, trainee_id: value }));
                if (errors.trainee_id) setErrors(prev => ({ ...prev, trainee_id: '' }));
              }}
            >
              <SelectTrigger className={errors.trainee_id ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('newTqc.resignationForm.selectTraineePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {trainees.map((trainee) => (
                  <SelectItem key={trainee.trainee_id} value={trainee.trainee_id}>
                    {trainee.name} {trainee.employee_id ? `(${trainee.employee_id})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.trainee_id && (
              <p className="text-xs text-destructive">{errors.trainee_id}</p>
            )}
          </div>

          {/* Resign Date */}
          <div className="space-y-2">
            <Label htmlFor="resign_date">
              {t('newTqc.resignationForm.resignDate')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="resign_date"
              type="date"
              value={formData.resign_date}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, resign_date: e.target.value }));
                if (errors.resign_date) setErrors(prev => ({ ...prev, resign_date: '' }));
              }}
              className={errors.resign_date ? 'border-destructive' : ''}
            />
            {errors.resign_date && (
              <p className="text-xs text-destructive">{errors.resign_date}</p>
            )}
          </div>

          {/* Reason Category */}
          <div className="space-y-2">
            <Label>
              {t('newTqc.resignationForm.reasonCategory')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.reason_category}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, reason_category: value as ResignationReason }));
                if (errors.reason_category) setErrors(prev => ({ ...prev, reason_category: '' }));
              }}
            >
              <SelectTrigger className={errors.reason_category ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('newTqc.resignationForm.reasonPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {RESIGNATION_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {t(`newTqc.resignations.reasons.${reason === 'HEALTH_ISSUE' ? 'healthIssue' : reason === 'FAMILY_MATTERS' ? 'familyMatters' : reason === 'LOW_SALARY' ? 'lowSalary' : reason === 'JOB_CHANGE' ? 'jobChange' : reason.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason_category && (
              <p className="text-xs text-destructive">{errors.reason_category}</p>
            )}
          </div>

          {/* Reason Detail */}
          <div className="space-y-2">
            <Label htmlFor="reason_detail">{t('newTqc.resignationForm.reasonDetail')}</Label>
            <Textarea
              id="reason_detail"
              value={formData.reason_detail || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, reason_detail: e.target.value || undefined }))}
              placeholder={t('newTqc.resignationForm.reasonDetailPlaceholder')}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving} variant="destructive">
            {saving ? t('common.saving') : t('newTqc.resignationForm.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
