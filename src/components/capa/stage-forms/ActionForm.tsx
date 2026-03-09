/**
 * Action Stage Form
 * Investigation → Action 단계 전환 폼
 */

import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionFormData } from './types';

interface ActionFormProps {
  form: ActionFormData;
  onChange: (form: ActionFormData) => void;
  validationErrors: Record<string, string>;
}

export function ActionForm({
  form,
  onChange,
  validationErrors,
}: ActionFormProps) {
  const { t } = useTranslation();

  const updateField = <K extends keyof ActionFormData>(
    field: K,
    value: ActionFormData[K]
  ) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="actionNotes">{t('capa.actionNotes')} *</Label>
        <Textarea
          id="actionNotes"
          value={form.actionNotes}
          onChange={(e) => updateField('actionNotes', e.target.value)}
          rows={4}
          placeholder={t('capa.actionNotesPlaceholder')}
          className={validationErrors.actionNotes ? 'border-destructive' : ''}
        />
        {validationErrors.actionNotes && (
          <p className="text-sm text-destructive">{validationErrors.actionNotes}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="plannedBy">{t('capa.assignedTo')} *</Label>
        <Input
          id="plannedBy"
          value={form.plannedBy}
          onChange={(e) => updateField('plannedBy', e.target.value)}
          placeholder={t('capa.assignedTo')}
          className={validationErrors.plannedBy ? 'border-destructive' : ''}
        />
        {validationErrors.plannedBy && (
          <p className="text-sm text-destructive">{validationErrors.plannedBy}</p>
        )}
      </div>
    </div>
  );
}
