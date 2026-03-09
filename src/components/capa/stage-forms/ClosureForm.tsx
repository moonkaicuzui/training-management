/**
 * Closure Stage Form
 * Verification → Closure 단계 전환 폼
 */

import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { VerificationFormData, ClosureFormData } from './types';

interface ClosureFormProps {
  verificationForm: VerificationFormData;
  onVerificationChange: (form: VerificationFormData) => void;
  closureForm: ClosureFormData;
  onClosureChange: (form: ClosureFormData) => void;
  validationErrors: Record<string, string>;
}

export function ClosureForm({
  verificationForm,
  onVerificationChange,
  closureForm,
  onClosureChange,
  validationErrors,
}: ClosureFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="effectivenessScoreClosure">{t('capa.form.effectivenessScoreLabel')} *</Label>
        <Input
          id="effectivenessScoreClosure"
          type="number"
          min={0}
          max={100}
          value={verificationForm.effectivenessScore}
          onChange={(e) =>
            onVerificationChange({
              ...verificationForm,
              effectivenessScore: e.target.value,
            })
          }
          placeholder={t('capa.form.effectivenessScorePlaceholder')}
          className={validationErrors.effectivenessScore ? 'border-destructive' : ''}
        />
        {validationErrors.effectivenessScore && (
          <p className="text-sm text-destructive">{validationErrors.effectivenessScore}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="finalReview">{t('capa.finalReview')} *</Label>
        <Textarea
          id="finalReview"
          value={closureForm.finalReview}
          onChange={(e) =>
            onClosureChange({
              ...closureForm,
              finalReview: e.target.value,
            })
          }
          rows={3}
          placeholder={t('capa.finalReviewPlaceholder')}
          className={validationErrors.finalReview ? 'border-destructive' : ''}
        />
        {validationErrors.finalReview && (
          <p className="text-sm text-destructive">{validationErrors.finalReview}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="lessonsLearned">{t('capa.lessonsLearned')}</Label>
        <Textarea
          id="lessonsLearned"
          value={closureForm.lessonsLearned}
          onChange={(e) =>
            onClosureChange({
              ...closureForm,
              lessonsLearned: e.target.value,
            })
          }
          rows={3}
          placeholder={t('capa.lessonsLearnedPlaceholder')}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="documentationComplete"
          checked={closureForm.documentationComplete}
          onCheckedChange={(checked) =>
            onClosureChange({
              ...closureForm,
              documentationComplete: checked === true,
            })
          }
        />
        <Label htmlFor="documentationComplete">{t('capa.documentationComplete')}</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="knowledgeShared"
          checked={closureForm.knowledgeShared}
          onCheckedChange={(checked) =>
            onClosureChange({
              ...closureForm,
              knowledgeShared: checked === true,
            })
          }
        />
        <Label htmlFor="knowledgeShared">{t('capa.knowledgeShared')}</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="closedBy">{t('capa.closedBy')} *</Label>
        <Input
          id="closedBy"
          value={closureForm.closedBy}
          onChange={(e) =>
            onClosureChange({
              ...closureForm,
              closedBy: e.target.value,
            })
          }
          placeholder={t('capa.closedBy')}
          className={validationErrors.closedBy ? 'border-destructive' : ''}
        />
        {validationErrors.closedBy && (
          <p className="text-sm text-destructive">{validationErrors.closedBy}</p>
        )}
      </div>
    </div>
  );
}
