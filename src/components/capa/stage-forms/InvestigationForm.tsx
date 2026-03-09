/**
 * Investigation Stage Form
 * Discovery → Investigation 단계 전환 폼
 */

import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CAPAAISuggestions } from '@/components/capa/CAPAAISuggestions';
import type { CAPA } from '@/types/capa';
import type { InvestigationFormData } from './types';

interface InvestigationFormProps {
  currentCAPA: CAPA;
  form: InvestigationFormData;
  onChange: (form: InvestigationFormData) => void;
  validationErrors: Record<string, string>;
}

export function InvestigationForm({
  currentCAPA,
  form,
  onChange,
  validationErrors,
}: InvestigationFormProps) {
  const { t } = useTranslation();

  const updateField = <K extends keyof InvestigationFormData>(
    field: K,
    value: InvestigationFormData[K]
  ) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <div className="space-y-4">
      {(!currentCAPA.discovery?.immediateActions?.trim()) && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">
            {t('capa.validation.immediateActionRequired')}
          </p>
        </div>
      )}
      {validationErrors.immediateActions && (
        <p className="text-sm text-destructive">{validationErrors.immediateActions}</p>
      )}

      <CAPAAISuggestions
        capaId={currentCAPA.id}
        problemDescription={currentCAPA.discovery?.problemDescription || ''}
        affectedArea={currentCAPA.discovery?.affectedArea || ''}
        severity={currentCAPA.severity}
        source={currentCAPA.discovery?.source || ''}
        onSelectRootCause={(cause) =>
          updateField('rootCauseAnalysis', cause)
        }
      />

      <div className="space-y-2">
        <Label htmlFor="rootCauseAnalysis">{t('capa.rootCauseAnalysis')} *</Label>
        <Textarea
          id="rootCauseAnalysis"
          value={form.rootCauseAnalysis}
          onChange={(e) => updateField('rootCauseAnalysis', e.target.value)}
          rows={3}
          placeholder={t('capa.rootCauseAnalysis')}
          className={validationErrors.rootCauseAnalysis ? 'border-destructive' : ''}
        />
        {validationErrors.rootCauseAnalysis && (
          <p className="text-sm text-destructive">{validationErrors.rootCauseAnalysis}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="impactAssessment">{t('capa.impactAssessment')} *</Label>
        <Textarea
          id="impactAssessment"
          value={form.impactAssessment}
          onChange={(e) => updateField('impactAssessment', e.target.value)}
          rows={3}
          placeholder={t('capa.impactAssessment')}
          className={validationErrors.impactAssessment ? 'border-destructive' : ''}
        />
        {validationErrors.impactAssessment && (
          <p className="text-sm text-destructive">{validationErrors.impactAssessment}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="findings">{t('capa.findings')} *</Label>
        <Textarea
          id="findings"
          value={form.findings}
          onChange={(e) => updateField('findings', e.target.value)}
          rows={3}
          placeholder={t('capa.findings')}
          className={validationErrors.findings ? 'border-destructive' : ''}
        />
        {validationErrors.findings && (
          <p className="text-sm text-destructive">{validationErrors.findings}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="investigatedBy">{t('capa.investigatedBy')} *</Label>
        <Input
          id="investigatedBy"
          value={form.investigatedBy}
          onChange={(e) => updateField('investigatedBy', e.target.value)}
          placeholder={t('capa.investigatedBy')}
          className={validationErrors.investigatedBy ? 'border-destructive' : ''}
        />
        {validationErrors.investigatedBy && (
          <p className="text-sm text-destructive">{validationErrors.investigatedBy}</p>
        )}
      </div>
    </div>
  );
}
