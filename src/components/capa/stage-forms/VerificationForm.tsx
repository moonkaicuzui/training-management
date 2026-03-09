/**
 * Verification Stage Form
 * Action → Verification 단계 전환 폼
 */

import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { VerificationFormData } from './types';

interface VerificationFormProps {
  form: VerificationFormData;
  onChange: (form: VerificationFormData) => void;
  validationErrors: Record<string, string>;
}

export function VerificationForm({
  form,
  onChange,
  validationErrors,
}: VerificationFormProps) {
  const { t } = useTranslation();

  const updateField = <K extends keyof VerificationFormData>(
    field: K,
    value: VerificationFormData[K]
  ) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verificationMethod">{t('capa.verificationMethod')} *</Label>
        <Input
          id="verificationMethod"
          value={form.verificationMethod}
          onChange={(e) => updateField('verificationMethod', e.target.value)}
          placeholder={t('capa.verificationMethod')}
          className={validationErrors.verificationMethod ? 'border-destructive' : ''}
        />
        {validationErrors.verificationMethod && (
          <p className="text-sm text-destructive">{validationErrors.verificationMethod}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="effectivenessScore">{t('capa.form.effectivenessScoreLabel')} *</Label>
        <Input
          id="effectivenessScore"
          type="number"
          min={0}
          max={100}
          value={form.effectivenessScore}
          onChange={(e) => updateField('effectivenessScore', e.target.value)}
          placeholder={t('capa.form.effectivenessScorePlaceholder')}
          className={validationErrors.effectivenessScore ? 'border-destructive' : ''}
        />
        {validationErrors.effectivenessScore && (
          <p className="text-sm text-destructive">{validationErrors.effectivenessScore}</p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isEffective"
          checked={form.isEffective}
          onCheckedChange={(checked) =>
            updateField('isEffective', checked === true)
          }
        />
        <Label htmlFor="isEffective">{t('capa.isEffective')}</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="verificationNotes">{t('capa.verificationNotes')} *</Label>
        <Textarea
          id="verificationNotes"
          value={form.verificationNotes}
          onChange={(e) => updateField('verificationNotes', e.target.value)}
          rows={3}
          placeholder={t('capa.verificationNotesPlaceholder')}
          className={validationErrors.verificationNotes ? 'border-destructive' : ''}
        />
        {validationErrors.verificationNotes && (
          <p className="text-sm text-destructive">{validationErrors.verificationNotes}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="verifiedBy">{t('capa.verifiedBy')} *</Label>
        <Input
          id="verifiedBy"
          value={form.verifiedBy}
          onChange={(e) => updateField('verifiedBy', e.target.value)}
          placeholder={t('capa.verifiedBy')}
          className={validationErrors.verifiedBy ? 'border-destructive' : ''}
        />
        {validationErrors.verifiedBy && (
          <p className="text-sm text-destructive">{validationErrors.verifiedBy}</p>
        )}
      </div>
    </div>
  );
}
