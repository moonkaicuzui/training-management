/**
 * CAPA Form Page
 *
 * 새 CAPA 등록 및 수정 폼
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useShallow } from 'zustand/react/shallow';
import { useCAPAStore } from '@/stores/capaStore';
import { useAuthStore } from '@/stores/authStore';
import {
  type CAPAType,
  type CAPASeverity,
  type CAPAPriority,
  type CAPASource,
  type CAPAInput,
} from '@/types/capa';

interface FormData {
  title: string;
  description: string;
  type: CAPAType;
  severity: CAPASeverity;
  priority: CAPAPriority;
  source: CAPASource;
  problemDescription: string;
  affectedArea: string;
  immediateActions: string;
  dueDate: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  type: 'corrective',
  severity: 'major',
  priority: 'medium',
  source: 'internal',
  problemDescription: '',
  affectedArea: '',
  immediateActions: '',
  dueDate: '',
};

export default function CAPAForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const user = useAuthStore((s) => s.user);
  const { createCAPA, updateCAPA, fetchCAPAById, currentCAPA, isLoading, error } = useCAPAStore(useShallow((state) => ({
    createCAPA: state.createCAPA,
    updateCAPA: state.updateCAPA,
    fetchCAPAById: state.fetchCAPAById,
    currentCAPA: state.currentCAPA,
    isLoading: state.isLoading,
    error: state.error,
  })));

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing CAPA for editing
  useEffect(() => {
    if (id) {
      fetchCAPAById(id);
    }
  }, [id, fetchCAPAById]);

  // Populate form when editing
  useEffect(() => {
    if (currentCAPA && isEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 편집 모드 초기화
      setFormData({
        title: currentCAPA.title,
        description: currentCAPA.description,
        type: currentCAPA.type,
        severity: currentCAPA.severity,
        priority: currentCAPA.priority,
        source: currentCAPA.source,
        problemDescription: currentCAPA.discovery.problemDescription,
        affectedArea: currentCAPA.discovery.affectedArea,
        immediateActions: currentCAPA.discovery.immediateActions || '',
        dueDate: currentCAPA.dueDate
          ? (currentCAPA.dueDate instanceof Date
              ? currentCAPA.dueDate.toISOString().split('T')[0]
              : new Date((currentCAPA.dueDate as { toDate: () => Date }).toDate()).toISOString().split('T')[0])
          : '',
      });
    }
  }, [currentCAPA, isEditing]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title.trim()) {
      errors.title = t('capa.validation.titleRequired');
    }

    if (!formData.description.trim()) {
      errors.description = t('capa.validation.descriptionRequired');
    }

    if (!formData.type) {
      errors.type = t('capa.validation.typeRequired');
    }

    if (!formData.severity) {
      errors.severity = t('capa.validation.severityRequired');
    }

    if (!formData.source) {
      errors.source = t('capa.validation.sourceRequired');
    }

    if (!formData.problemDescription.trim()) {
      errors.problemDescription = t('capa.validation.problemDescRequired');
    }

    if (!formData.affectedArea.trim()) {
      errors.affectedArea = t('capa.validation.affectedAreaRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const capaInput: CAPAInput = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        severity: formData.severity,
        priority: formData.priority,
        source: formData.source,
        discovery: {
          problemDescription: formData.problemDescription,
          source: formData.source,
          discoveredBy: user?.email || 'unknown',
          affectedArea: formData.affectedArea,
          immediateActions: formData.immediateActions || undefined,
        },
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        owner: user?.email || 'unknown',
      };

      if (isEditing && id) {
        await updateCAPA(id, {
          title: formData.title,
          description: formData.description,
          severity: formData.severity,
          priority: formData.priority,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        });
        navigate(`/capa/${id}`);
      } else {
        const newId = await createCAPA(capaInput);
        navigate(`/capa/${newId}`);
      }
    } catch {
      // Error is handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label={t('common.aria.goBack')}>
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? t('capa.form.editTitle') : t('capa.form.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('capa.description')}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive bg-destructive/10" role="alert">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('capa.details')}</CardTitle>
            <CardDescription>{t('capa.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                {t('capa.form.titleLabel')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('capa.form.titlePlaceholder')}
                className={validationErrors.title ? 'border-destructive' : ''}
                aria-invalid={!!validationErrors.title}
                aria-describedby={validationErrors.title ? 'title-error' : undefined}
              />
              {validationErrors.title && (
                <p id="title-error" className="text-sm text-destructive" role="alert">{validationErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t('capa.form.descriptionLabel')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('capa.form.descriptionPlaceholder')}
                rows={3}
                className={validationErrors.description ? 'border-destructive' : ''}
                aria-invalid={!!validationErrors.description}
                aria-describedby={validationErrors.description ? 'description-error' : undefined}
              />
              {validationErrors.description && (
                <p id="description-error" className="text-sm text-destructive" role="alert">{validationErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('capa.form.categoryLabel')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: CAPAType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className={validationErrors.type ? 'border-destructive' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['corrective', 'preventive'] as CAPAType[]).map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`capa.typeLabels.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.type && (
                  <p className="text-sm text-destructive">{validationErrors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  {t('capa.cause')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.source}
                  onValueChange={(value: CAPASource) =>
                    setFormData({ ...formData, source: value })
                  }
                >
                  <SelectTrigger className={validationErrors.source ? 'border-destructive' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['audit', 'customer', 'internal', 'supplier', 'process', 'training'] as CAPASource[]).map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`capa.sourceLabels.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.source && (
                  <p className="text-sm text-destructive">{validationErrors.source}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('capa.form.severityLabel')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: CAPASeverity) =>
                    setFormData({ ...formData, severity: value })
                  }
                >
                  <SelectTrigger className={validationErrors.severity ? 'border-destructive' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['critical', 'major', 'minor'] as CAPASeverity[]).map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`capa.severityLabels.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.severity && (
                  <p className="text-sm text-destructive">{validationErrors.severity}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('capa.form.priorityLabel')}</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: CAPAPriority) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['high', 'medium', 'low'] as CAPAPriority[]).map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`capa.priorityLabels.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">{t('capa.dueDate')}</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Discovery Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('capa.findingStage')}</CardTitle>
            <CardDescription>{t('capa.problemDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="problemDescription">
                {t('capa.problemDescription')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="problemDescription"
                value={formData.problemDescription}
                onChange={(e) =>
                  setFormData({ ...formData, problemDescription: e.target.value })
                }
                placeholder={t('capa.form.problemDescPlaceholder')}
                rows={4}
                className={validationErrors.problemDescription ? 'border-destructive' : ''}
                aria-invalid={!!validationErrors.problemDescription}
                aria-describedby={validationErrors.problemDescription ? 'problemDescription-error' : undefined}
              />
              {validationErrors.problemDescription && (
                <p id="problemDescription-error" className="text-sm text-destructive" role="alert">{validationErrors.problemDescription}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="affectedArea">
                {t('capa.affectedArea')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="affectedArea"
                value={formData.affectedArea}
                onChange={(e) => setFormData({ ...formData, affectedArea: e.target.value })}
                placeholder={t('capa.form.affectedAreaPlaceholder')}
                className={validationErrors.affectedArea ? 'border-destructive' : ''}
                aria-invalid={!!validationErrors.affectedArea}
                aria-describedby={validationErrors.affectedArea ? 'affectedArea-error' : undefined}
              />
              {validationErrors.affectedArea && (
                <p id="affectedArea-error" className="text-sm text-destructive" role="alert">{validationErrors.affectedArea}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="immediateActions">{t('capa.immediateAction')}</Label>
              <Textarea
                id="immediateActions"
                value={formData.immediateActions}
                onChange={(e) =>
                  setFormData({ ...formData, immediateActions: e.target.value })
                }
                placeholder={t('capa.form.immediateActionsPlaceholder')}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t('capa.form.cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading || isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {(isLoading || isSubmitting) ? t('common.saving') : isEditing ? t('capa.form.update') : t('capa.form.submit')}
        </Button>
      </div>
    </div>
  );
}
