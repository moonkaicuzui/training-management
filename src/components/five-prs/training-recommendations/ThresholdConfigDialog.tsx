import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEFAULT_THRESHOLDS } from '@/types/recommendation';
import type { ThresholdConfigDialogProps } from './types';

export function ThresholdConfigDialog({
  open,
  onOpenChange,
  thresholds,
  onSave,
}: ThresholdConfigDialogProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    immediate_rate: DEFAULT_THRESHOLDS.immediate_rate,
    preventive_rate_min: DEFAULT_THRESHOLDS.preventive_rate_min,
    preventive_rate_max: DEFAULT_THRESHOLDS.preventive_rate_max,
    min_validation_count: DEFAULT_THRESHOLDS.min_validation_count,
    surge_multiplier: DEFAULT_THRESHOLDS.surge_multiplier,
    surge_min_rate: DEFAULT_THRESHOLDS.surge_min_rate,
    surge_recent_days: DEFAULT_THRESHOLDS.surge_recent_days,
    surge_past_days: DEFAULT_THRESHOLDS.surge_past_days,
  });

  useEffect(() => {
    if (open && thresholds) {
      setForm({
        immediate_rate: thresholds.immediate_rate,
        preventive_rate_min: thresholds.preventive_rate_min,
        preventive_rate_max: thresholds.preventive_rate_max,
        min_validation_count: thresholds.min_validation_count,
        surge_multiplier: thresholds.surge_multiplier,
        surge_min_rate: thresholds.surge_min_rate,
        surge_recent_days: thresholds.surge_recent_days,
        surge_past_days: thresholds.surge_past_days,
      });
    }
  }, [open, thresholds]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: Number(value) || 0 }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('recommendation.settings.title')}</DialogTitle>
          <DialogDescription>
            {t('recommendation.settings.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="immediate_rate">
                {t('recommendation.settings.immediateRate')}
              </Label>
              <Input
                id="immediate_rate"
                type="number"
                step="0.1"
                value={form.immediate_rate}
                onChange={(e) => handleChange('immediate_rate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_validation_count">
                {t('recommendation.settings.minValidationCount')}
              </Label>
              <Input
                id="min_validation_count"
                type="number"
                value={form.min_validation_count}
                onChange={(e) => handleChange('min_validation_count', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preventive_rate_min">
                {t('recommendation.settings.preventiveRateMin')}
              </Label>
              <Input
                id="preventive_rate_min"
                type="number"
                step="0.1"
                value={form.preventive_rate_min}
                onChange={(e) => handleChange('preventive_rate_min', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preventive_rate_max">
                {t('recommendation.settings.preventiveRateMax')}
              </Label>
              <Input
                id="preventive_rate_max"
                type="number"
                step="0.1"
                value={form.preventive_rate_max}
                onChange={(e) => handleChange('preventive_rate_max', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surge_multiplier">
                {t('recommendation.settings.surgeMultiplier')}
              </Label>
              <Input
                id="surge_multiplier"
                type="number"
                step="0.1"
                value={form.surge_multiplier}
                onChange={(e) => handleChange('surge_multiplier', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surge_min_rate">
                {t('recommendation.settings.surgeMinRate')}
              </Label>
              <Input
                id="surge_min_rate"
                type="number"
                step="0.1"
                value={form.surge_min_rate}
                onChange={(e) => handleChange('surge_min_rate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surge_recent_days">
                {t('recommendation.settings.surgeRecentDays')}
              </Label>
              <Input
                id="surge_recent_days"
                type="number"
                value={form.surge_recent_days}
                onChange={(e) => handleChange('surge_recent_days', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="surge_past_days">
              {t('recommendation.settings.surgePastDays')}
            </Label>
            <Input
              id="surge_past_days"
              type="number"
              value={form.surge_past_days}
              onChange={(e) => handleChange('surge_past_days', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
