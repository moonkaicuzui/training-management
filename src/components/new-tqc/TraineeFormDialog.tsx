import { useState, useEffect } from 'react';
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
  introducer: undefined,
};

export function TraineeFormDialog({
  open,
  onClose,
  onSubmit,
  trainee,
  teams,
}: TraineeFormDialogProps) {
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
      newErrors.name = '이름을 입력하세요.';
    }
    if (!formData.team_id) {
      newErrors.team_id = '배치예정팀을 선택하세요.';
    }
    if (!formData.trainer_id) {
      newErrors.trainer_id = '트레이너를 선택하세요.';
    }
    if (!formData.start_date) {
      newErrors.start_date = '시작일을 선택하세요.';
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '교육생 수정' : '신규 교육생 등록'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '교육생 정보를 수정합니다.'
              : '새로운 신입 교육생을 등록합니다.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="교육생 이름"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Employee ID (optional) */}
          <div className="space-y-2">
            <Label htmlFor="employee_id">사번 (선택)</Label>
            <Input
              id="employee_id"
              value={formData.employee_id || ''}
              onChange={(e) => handleChange('employee_id', e.target.value || undefined)}
              placeholder="사번이 있는 경우 입력"
            />
          </div>

          {/* Team */}
          <div className="space-y-2">
            <Label>
              배치예정팀 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.team_id}
              onValueChange={(value) => handleChange('team_id', value)}
            >
              <SelectTrigger className={errors.team_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="팀 선택" />
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
              담당 트레이너 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.trainer_id}
              onValueChange={(value) => handleChange('trainer_id', value)}
            >
              <SelectTrigger className={errors.trainer_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="트레이너 선택" />
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

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start_date">
              교육 시작일 <span className="text-destructive">*</span>
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
                  ({weekNumber}주차)
                </span>
              )}
            </div>
            {errors.start_date && (
              <p className="text-xs text-destructive">{errors.start_date}</p>
            )}
          </div>

          {/* Introducer (optional) */}
          <div className="space-y-2">
            <Label htmlFor="introducer">소개자 (선택)</Label>
            <Input
              id="introducer"
              value={formData.introducer || ''}
              onChange={(e) => handleChange('introducer', e.target.value || undefined)}
              placeholder="소개자 이름"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? '저장 중...' : isEdit ? '수정' : '등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
