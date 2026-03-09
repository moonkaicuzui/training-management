import { useTranslation } from 'react-i18next';
import type { CertificateTemplate } from '@/services/certificateService';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { TemplateFormData } from './types';

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: CertificateTemplate | null;
  formData: TemplateFormData;
  onFormDataChange: (updater: (prev: TemplateFormData) => TemplateFormData) => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function TemplateFormDialog({
  open,
  onOpenChange,
  editingTemplate,
  formData,
  onFormDataChange,
  onSave,
  isSaving,
}: TemplateFormDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
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
              onChange={(e) => onFormDataChange((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('certificates.templateNamePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateDesc">{t('certificates.templateDesc')}</Label>
            <Input
              id="templateDesc"
              value={formData.description}
              onChange={(e) => onFormDataChange((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t('certificates.templateDescPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('certificates.borderStyle')}</Label>
              <Select
                value={formData.border_style}
                onValueChange={(v) =>
                  onFormDataChange((prev) => ({
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
                    onFormDataChange((prev) => ({ ...prev, border_color: e.target.value }))
                  }
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={formData.border_color}
                  onChange={(e) =>
                    onFormDataChange((prev) => ({ ...prev, border_color: e.target.value }))
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
              onChange={(e) => onFormDataChange((prev) => ({ ...prev, logo_text: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgName">{t('certificates.orgName')}</Label>
            <Input
              id="orgName"
              value={formData.org_name}
              onChange={(e) => onFormDataChange((prev) => ({ ...prev, org_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="titleText">{t('certificates.titleText')}</Label>
            <Input
              id="titleText"
              value={formData.title_text}
              onChange={(e) => onFormDataChange((prev) => ({ ...prev, title_text: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.is_default}
              onChange={(e) =>
                onFormDataChange((prev) => ({ ...prev, is_default: e.target.checked }))
              }
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="isDefault">{t('certificates.setAsDefault')}</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave} disabled={isSaving || !formData.name.trim()}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
