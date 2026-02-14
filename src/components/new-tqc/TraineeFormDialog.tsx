import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  NewTQCTraineeInput,
  NewTQCTeam,
} from '@/types/newTqc';
import { NEW_TQC_TRAINERS, getWeekNumber } from '@/types/newTqc';
import { BUILDINGS, WORKING_AREAS } from '@/data/constants';
import { addMonths, format } from 'date-fns';

interface TraineeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewTQCTraineeInput) => Promise<void>;
  trainee?: NewTQCTrainee | null;
  teams: NewTQCTeam[];
}

const initialFormData: NewTQCTraineeInput = {
  name: '',
  team_id: '',
  trainer_id: '',
  start_date: new Date().toISOString().split('T')[0],
  employee_id: undefined,
  building: undefined,
  working_area: undefined,
  introducer: undefined,
};

export function TraineeFormDialog({
  open,
  onClose,
  onSubmit,
  trainee,
  teams,
}: TraineeFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!trainee;
  const [formData, setFormData] = useState<NewTQCTraineeInput>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (trainee) {
      setFormData({
        name: trainee.name,
        team_id: trainee.team_id,
        trainer_id: trainee.trainer_id,
        start_date: trainee.start_date,
        employee_id: trainee.employee_id,
        building: trainee.building,
        working_area: trainee.working_area,
        introducer: trainee.introducer,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [trainee, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('newTqc.traineeForm.nameRequired');
    }
    if (!formData.team_id) {
      newErrors.team_id = t('newTqc.traineeForm.teamRequired');
    }
    if (!formData.trainer_id) {
      newErrors.trainer_id = t('newTqc.traineeForm.trainerRequired');
    }
    if (!formData.start_date) {
      newErrors.start_date = t('newTqc.traineeForm.startDateRequired');
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

  const handleChange = (field: keyof NewTQCTraineeInput, value: string | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Calculate week number from start date
  const weekNumber = formData.start_date ? getWeekNumber(formData.start_date) : null;

  // Calculate training end date (start_date + 1 month)
  const trainingEndDate = useMemo(() => {
    if (!formData.start_date) return null;
    try {
      return format(addMonths(new Date(formData.start_date), 1), 'yyyy-MM-dd');
    } catch {
      return null;
    }
  }, [formData.start_date]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('newTqc.traineeForm.editTitle') : t('newTqc.traineeForm.createTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('newTqc.traineeForm.editDescription')
              : t('newTqc.traineeForm.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('newTqc.traineeForm.name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('newTqc.traineeForm.namePlaceholder')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Employee ID (optional) */}
          <div className="space-y-2">
            <Label htmlFor="employee_id">{t('newTqc.traineeForm.employeeId')}</Label>
            <Input
              id="employee_id"
              value={formData.employee_id || ''}
              onChange={(e) => handleChange('employee_id', e.target.value || undefined)}
              placeholder={t('newTqc.traineeForm.employeeIdPlaceholder')}
            />
          </div>

          {/* Team */}
          <div className="space-y-2">
            <Label>
              {t('newTqc.traineeForm.team')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.team_id}
              onValueChange={(value) => handleChange('team_id', value)}
            >
              <SelectTrigger className={errors.team_id ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('newTqc.traineeForm.teamPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {teams.filter((t) => t.is_active).map((team) => (
                  <SelectItem key={team.team_id} value={team.team_id}>
                    {team.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.team_id && (
              <p className="text-xs text-destructive">{errors.team_id}</p>
            )}
          </div>

          {/* Trainer */}
          <div className="space-y-2">
            <Label>
              {t('newTqc.traineeForm.trainer')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.trainer_id}
              onValueChange={(value) => handleChange('trainer_id', value)}
            >
              <SelectTrigger className={errors.trainer_id ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('newTqc.traineeForm.trainerPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {NEW_TQC_TRAINERS.map((trainer: string) => (
                  <SelectItem key={trainer} value={trainer}>
                    {trainer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.trainer_id && (
              <p className="text-xs text-destructive">{errors.trainer_id}</p>
            )}
          </div>

          {/* Building */}
          <div className="space-y-2">
            <Label>{t('newTqc.traineeForm.building')}</Label>
            <Select
              value={formData.building || ''}
              onValueChange={(value) => handleChange('building', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('newTqc.traineeForm.buildingPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {BUILDINGS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Working Area */}
          <div className="space-y-2">
            <Label>{t('newTqc.traineeForm.workingArea')}</Label>
            <Select
              value={formData.working_area || ''}
              onValueChange={(value) => handleChange('working_area', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('newTqc.traineeForm.workingAreaPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {WORKING_AREAS.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start_date">
              {t('newTqc.traineeForm.startDate')} <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className={errors.start_date ? 'border-destructive' : ''}
              />
              {weekNumber && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  ({t('newTqc.traineeForm.weekNumber', { week: weekNumber })})
                </span>
              )}
            </div>
            {trainingEndDate && (
              <p className="text-xs text-muted-foreground">
                {t('newTqc.traineeForm.trainingEndDate', { date: trainingEndDate })}
              </p>
            )}
            {errors.start_date && (
              <p className="text-xs text-destructive">{errors.start_date}</p>
            )}
          </div>

          {/* Introducer (optional) */}
          <div className="space-y-2">
            <Label htmlFor="introducer">{t('newTqc.traineeForm.introducer')}</Label>
            <Input
              id="introducer"
              value={formData.introducer || ''}
              onChange={(e) => handleChange('introducer', e.target.value || undefined)}
              placeholder={t('newTqc.traineeForm.introducerPlaceholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? t('common.saving') : isEdit ? t('common.edit') : t('common.register')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
