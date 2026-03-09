import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import * as api from '@/services/api';
import type { CertificateTemplate } from '@/services/certificateService';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  TemplateTable,
  TemplateFormDialog,
  DeleteConfirmDialog,
  TemplatePreviewDialog,
  EmptyTemplateState,
  INITIAL_FORM_DATA,
} from './certificate-templates';
import type { TemplateFormData } from './certificate-templates';

export default function CertificateTemplateManager() {
  const { t } = useTranslation();

  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<CertificateTemplate | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getCertificateTemplates(false);
      setTemplates(data);
    } catch (err) {
      logger.error('Failed to load templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleAdd = () => {
    setEditingTemplate(null);
    setFormData(INITIAL_FORM_DATA);
    setShowForm(true);
  };

  const handleEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      border_style: template.border_style,
      border_color: template.border_color,
      logo_text: template.logo_text,
      org_name: template.org_name,
      title_text: template.title_text,
      is_default: template.is_default,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    try {
      setIsSaving(true);

      if (editingTemplate) {
        await api.updateCertificateTemplate(editingTemplate.template_id, {
          ...formData,
          is_active: true,
        });
      } else {
        await api.createCertificateTemplate({
          ...formData,
          is_active: true,
        });
      }

      setShowForm(false);
      setEditingTemplate(null);
      await loadTemplates();
    } catch (err) {
      logger.error('Failed to save template:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      await api.updateCertificateTemplate(templateId, { is_default: true });
      await loadTemplates();
    } catch (err) {
      logger.error('Failed to set default template:', err);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      await api.deleteCertificateTemplate(templateId);
      setShowDeleteConfirm(null);
      await loadTemplates();
    } catch (err) {
      logger.error('Failed to delete template:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('certificates.templates')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('certificates.templatesDesc')}
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('certificates.addTemplate')}
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyTemplateState onAdd={handleAdd} />
      ) : (
        <TemplateTable
          templates={templates}
          onEdit={handleEdit}
          onDelete={(id: string) => setShowDeleteConfirm(id)}
          onSetDefault={handleSetDefault}
          onPreview={(tmpl: CertificateTemplate) => setShowPreview(tmpl)}
        />
      )}

      <TemplateFormDialog
        open={showForm}
        onOpenChange={(open: boolean) => !open && setShowForm(false)}
        editingTemplate={editingTemplate}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <DeleteConfirmDialog
        templateId={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
      />

      <TemplatePreviewDialog
        template={showPreview}
        onClose={() => setShowPreview(null)}
      />
    </div>
  );
}
