import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GuidelineDeleteDialogProps {
  deleteConfirmId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isLoading: boolean;
}

export function GuidelineDeleteDialog({
  deleteConfirmId,
  onClose,
  onConfirm,
  isLoading,
}: GuidelineDeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!deleteConfirmId} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('tech.guidelines.deleteConfirm')}</DialogTitle>
          <DialogDescription>
            {t('tech.guidelines.deleteWarning')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteConfirmId && onConfirm(deleteConfirmId)}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
