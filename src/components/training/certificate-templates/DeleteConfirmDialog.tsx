import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface DeleteConfirmDialogProps {
  templateId: string | null;
  onClose: () => void;
  onConfirm: (templateId: string) => void;
}

export default function DeleteConfirmDialog({
  templateId,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!templateId} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('certificates.deleteTemplate')}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          {t('certificates.deleteTemplateConfirm')}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => templateId && onConfirm(templateId)}
          >
            {t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
