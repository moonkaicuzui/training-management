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

import { useCAPAStore } from '@/stores/capaStore';
import { useAuthStore } from '@/stores/authStore';
import {
  CAPA_TYPE_LABELS,
  CAPA_SEVERITY_LABELS,
  CAPA_PRIORITY_LABELS,
  CAPA_SOURCE_LABELS,
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

  const { user } = useAuthStore();
  const { createCAPA, updateCAPA, fetchCAPAById, currentCAPA, isLoading, error } = useCAPAStore();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof FormData, string>>>({});

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
      errors.title = t('capa.form.titleRequired');
    }

    if (!formData.description.trim()) {
      errors.description = t('capa.form.descriptionRequired');
    }

    if (!formData.problemDescription.trim()) {
      errors.problemDescription = t('capa.form.problemDescRequired');
    }

    if (!formData.affectedArea.trim()) {
      errors.affectedArea = t('capa.form.affectedAreaRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

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
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
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
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
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
              />
              {validationErrors.title && (
                <p className="text-sm text-destructive">{validationErrors.title}</p>
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
              />
              {validationErrors.description && (
                <p className="text-sm text-destructive">{validationErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('capa.form.categoryLabel')}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: CAPAType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAPA_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('capa.cause')}</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value: CAPASource) =>
                    setFormData({ ...formData, source: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAPA_SOURCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('capa.form.severityLabel')}</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: CAPASeverity) =>
                    setFormData({ ...formData, severity: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAPA_SEVERITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    {Object.entries(CAPA_PRIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
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
              />
              {validationErrors.problemDescription && (
                <p className="text-sm text-destructive">{validationErrors.problemDescription}</p>
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
              />
              {validationErrors.affectedArea && (
                <p className="text-sm text-destructive">{validationErrors.affectedArea}</p>
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
                placeholder="문제 발견 후 즉시 취한 조치"
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
        <Button onClick={handleSubmit} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? t('common.saving') : isEditing ? t('capa.form.update') : t('capa.form.submit')}
        </Button>
      </div>
    </div>
  );
}
