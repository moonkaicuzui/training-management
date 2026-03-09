import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { ProgramCategory, TrainingLevel, TrainingType, EvaluationType } from '@/types';
import { categories, positions } from '@/data/constants';
import { TRAINING_LEVELS, TRAINING_TYPES } from '@/data/constants';

export interface ProgramFormData {
  program_code: string;
  program_name: string;
  program_name_vn: string;
  program_name_kr: string;
  category: ProgramCategory;
  tags: string;
  target_positions: string[];
  evaluation_type: EvaluationType;
  passing_score: number;
  grade_aa: number;
  grade_a: number;
  grade_b: number;
  duration_hours: number;
  validity_months: number | null;
  training_level: TrainingLevel | '';
  training_type: TrainingType | '';
}

interface ProgramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ProgramFormData;
  onFormDataChange: (data: ProgramFormData) => void;
  isEditing: boolean;
  onSave: () => void;
}

export function ProgramFormDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  isEditing,
  onSave,
}: ProgramFormDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('program.editProgram') : t('program.addProgram')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('program.editDescription') : t('program.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('program.code')} *</Label>
              <Input
                value={formData.program_code}
                onChange={(e) => onFormDataChange({ ...formData, program_code: e.target.value })}
                placeholder="QIP-001"
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('program.category')} *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => onFormDataChange({ ...formData, category: v as ProgramCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {t(`category.${cat.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('program.name')} (EN) *</Label>
            <Input
              value={formData.program_name}
              onChange={(e) => onFormDataChange({ ...formData, program_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('program.name')} (VN)</Label>
              <Input
                value={formData.program_name_vn}
                onChange={(e) => onFormDataChange({ ...formData, program_name_vn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('program.name')} (KR)</Label>
              <Input
                value={formData.program_name_kr}
                onChange={(e) => onFormDataChange({ ...formData, program_name_kr: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Label>{t('program.targetPositions')}</Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md">
              {positions.map((pos) => (
                <label key={pos.value} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={formData.target_positions.includes(pos.value)}
                    onCheckedChange={(checked) => {
                      onFormDataChange({
                        ...formData,
                        target_positions: checked
                          ? [...formData.target_positions, pos.value]
                          : formData.target_positions.filter(p => p !== pos.value),
                      });
                    }}
                  />
                  {t(`position.${pos.value}`)}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('program.passingScore')}</Label>
              <Input
                type="number"
                value={formData.passing_score}
                onChange={(e) => onFormDataChange({ ...formData, passing_score: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('program.duration')}</Label>
              <Input
                type="number"
                value={formData.duration_hours}
                onChange={(e) => onFormDataChange({ ...formData, duration_hours: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('program.validity')}</Label>
              <Input
                type="number"
                value={formData.validity_months ?? ''}
                onChange={(e) => onFormDataChange({ ...formData, validity_months: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="-"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('program.tags')}</Label>
            <Textarea
              value={formData.tags}
              onChange={(e) => onFormDataChange({ ...formData, tags: e.target.value })}
              placeholder={t('program.tagsPlaceholder')}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
