import { useTranslation } from 'react-i18next';
import type { CertificateTemplate } from '@/services/certificateService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TemplatePreviewDialogProps {
  template: CertificateTemplate | null;
  onClose: () => void;
}

export default function TemplatePreviewDialog({
  template,
  onClose,
}: TemplatePreviewDialogProps) {
  const { t } = useTranslation();

  if (!template) return null;

  return (
    <Dialog open={!!template} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('certificates.previewTitle')} - {template.name}</DialogTitle>
        </DialogHeader>
        <div
          className="p-8 bg-white text-center mx-auto"
          style={{
            border: `8px ${template.border_style} ${template.border_color}`,
            minHeight: '300px',
            maxWidth: '600px',
          }}
        >
          <p
            className="text-2xl font-bold mb-2"
            style={{ color: template.border_color }}
          >
            {template.logo_text}
          </p>
          <p className="text-sm text-muted-foreground">{template.org_name}</p>
          <h2
            className="text-3xl font-bold my-6"
            style={{ color: template.border_color }}
          >
            {template.title_text}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t('certificates.certBody')}
          </p>
          <p className="text-2xl font-bold my-4">{t('certificates.sampleName')}</p>
          <p className="text-sm text-muted-foreground">{t('certificates.sampleDept')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
