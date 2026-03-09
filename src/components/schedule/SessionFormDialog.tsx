import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TrainingProgram, TrainingType, TrainingLevel } from '@/types';
import { TRAINING_TYPES, TRAINING_LEVELS } from '@/data/constants';

export interface SessionFormData {
  program_code: string;
  session_date: string;
  session_time: string;
  trainer: string;
  location: string;
  max_attendees: number;
  training_level: TrainingLevel | '';
  training_type: TrainingType | '';
  notes: string;
}

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: SessionFormData;
  onFormDataChange: (data: SessionFormData) => void;
  onSubmit: () => void;
  programs: TrainingProgram[];
}

export default function SessionFormDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  programs,
}: SessionFormDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('session.addSession')}</DialogTitle>
          <DialogDescription>
            {t('schedule.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('schedule.programRequired')}</Label>
            <Select
              value={formData.program_code}
              onValueChange={(value) => {
                const selectedProgram = programs.find(p => p.program_code === value);
                onFormDataChange({
                  ...formData,
                  program_code: value,
                  training_level: selectedProgram?.training_level || formData.training_level,
                  training_type: selectedProgram?.training_type || formData.training_type,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('schedule.programPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {programs.filter(p => p.is_active).map((program) => (
                  <SelectItem key={program.program_code} value={program.program_code}>
                    {program.program_code} - {program.program_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('schedule.dateRequired')}</Label>
              <Input
                type="date"
                value={formData.session_date}
                onChange={(e) => onFormDataChange({ ...formData, session_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('schedule.time')}</Label>
              <Input
                type="time"
                value={formData.session_time}
                onChange={(e) => onFormDataChange({ ...formData, session_time: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('schedule.trainerLabel')}</Label>
            <Input
              value={formData.trainer}
              onChange={(e) => onFormDataChange({ ...formData, trainer: e.target.value })}
              placeholder={t('schedule.trainerPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('schedule.locationLabel')}</Label>
            <Input
              value={formData.location}
              onChange={(e) => onFormDataChange({ ...formData, location: e.target.value })}
              placeholder={t('schedule.locationPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('schedule.maxAttendees')}</Label>
            <Input
              type="number"
              value={formData.max_attendees}
              onChange={(e) => onFormDataChange({ ...formData, max_attendees: parseInt(e.target.value) || 20 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('trainingLevel.title')}</Label>
              <Select
                value={formData.training_level || 'none'}
                onValueChange={(v) => onFormDataChange({ ...formData, training_level: v === 'none' ? '' : v as TrainingLevel })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {TRAINING_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {t(`trainingLevel.${level.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('trainingType.title')}</Label>
              <Select
                value={formData.training_type || 'none'}
                onValueChange={(v) => onFormDataChange({ ...formData, training_type: v === 'none' ? '' : v as TrainingType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {TRAINING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {t(`trainingType.${type.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('schedule.memo')}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
              placeholder={t('schedule.memoPlaceholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
