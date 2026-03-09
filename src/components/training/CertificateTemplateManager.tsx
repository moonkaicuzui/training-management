import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import * as api from '@/services/api';
import type { CertificateTemplate } from '@/services/certificateService';
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
  FileText,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TemplateFormData {
  name: string;
  description: string;
  border_style: 'double' | 'solid' | 'ornate';
  border_color: string;
  logo_text: string;
  org_name: string;
  title_text: string;
  is_default: boolean;
}

const INITIAL_FORM_DATA: TemplateFormData = {
  name: '',
  description: '',
  border_style: 'double',
  border_color: '#1E40AF',
  logo_text: 'Q-TRAIN',
  org_name: 'HWK Vietnam QIP Team',
  title_text: 'Certificate of Completion',
  is_default: false,
};

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

  const getBorderStyleLabel = (style: string) => {
    switch (style) {
      case 'double':
        return t('certificates.borderDouble');
      case 'solid':
        return t('certificates.borderSolid');
      case 'ornate':
        return t('certificates.borderOrnate');
      default:
        return style;
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
      {/* Header with add button */}
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

      {/* Templates list */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {t('certificates.noTemplates')}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {t('certificates.createFirstTemplate')}
            </p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              {t('certificates.addTemplate')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('certificates.templateName')}</TableHead>
                  <TableHead>{t('certificates.templateDesc')}</TableHead>
                  <TableHead>{t('certificates.borderStyle')}</TableHead>
                  <TableHead>{t('certificates.borderColor')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.template_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.name}</span>
                        {template.is_default && (
                          <Badge variant="default" className="gap-1">
                            <Star className="h-3 w-3" />
                            {t('certificates.isDefault')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {template.description || '-'}
                    </TableCell>
                    <TableCell>{getBorderStyleLabel(template.border_style)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: template.border_color }}
                        />
                        <span className="text-xs font-mono">{template.border_color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? 'success' : 'secondary'}>
                        {template.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPreview(template)}
                          title={t('certificates.previewTitle')}
                        >
                          <Palette className="h-4 w-4" />
                        </Button>
                        {!template.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(template.template_id)}
                            title={t('certificates.setDefault')}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          title={t('common.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(template.template_id)}
                          title={t('common.delete')}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Template Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? t('certificates.editTemplate') : t('certificates.addTemplate')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">{t('certificates.templateName')}</Label>
              <Input
                id="templateName"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('certificates.templateNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateDesc">{t('certificates.templateDesc')}</Label>
              <Input
                id="templateDesc"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t('certificates.templateDescPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('certificates.borderStyle')}</Label>
                <Select
                  value={formData.border_style}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      border_style: v as 'double' | 'solid' | 'ornate',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="double">{t('certificates.borderDouble')}</SelectItem>
                    <SelectItem value="solid">{t('certificates.borderSolid')}</SelectItem>
                    <SelectItem value="ornate">{t('certificates.borderOrnate')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="borderColor">{t('certificates.borderColor')}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="borderColor"
                    value={formData.border_color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, border_color: e.target.value }))
                    }
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.border_color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, border_color: e.target.value }))
                    }
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoText">{t('certificates.logoText')}</Label>
              <Input
                id="logoText"
                value={formData.logo_text}
                onChange={(e) => setFormData((prev) => ({ ...prev, logo_text: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgName">{t('certificates.orgName')}</Label>
              <Input
                id="orgName"
                value={formData.org_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, org_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="titleText">{t('certificates.titleText')}</Label>
              <Input
                id="titleText"
                value={formData.title_text}
                onChange={(e) => setFormData((prev) => ({ ...prev, title_text: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.is_default}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_default: e.target.checked }))
                }
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="isDefault">{t('certificates.setAsDefault')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('certificates.deleteTemplate')}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {t('certificates.deleteTemplateConfirm')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      {showPreview && (
        <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{t('certificates.previewTitle')} - {showPreview.name}</DialogTitle>
            </DialogHeader>
            <div
              className="p-8 bg-white text-center mx-auto"
              style={{
                border: `8px ${showPreview.border_style} ${showPreview.border_color}`,
                minHeight: '300px',
                maxWidth: '600px',
              }}
            >
              <p
                className="text-2xl font-bold mb-2"
                style={{ color: showPreview.border_color }}
              >
                {showPreview.logo_text}
              </p>
              <p className="text-sm text-muted-foreground">{showPreview.org_name}</p>
              <h2
                className="text-3xl font-bold my-6"
                style={{ color: showPreview.border_color }}
              >
                {showPreview.title_text}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t('certificates.certBody')}
              </p>
              <p className="text-2xl font-bold my-4">{t('certificates.sampleName')}</p>
              <p className="text-sm text-muted-foreground">{t('certificates.sampleDept')}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
