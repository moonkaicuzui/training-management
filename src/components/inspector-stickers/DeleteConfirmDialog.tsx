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
import type { DeleteConfirmDialogProps } from './types';

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  deleteTarget,
  isSaving,
  onDelete,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('inspectorStickers.dialog.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('inspectorStickers.dialog.deleteDescription', {
              stickerId: deleteTarget?.sticker_id,
              employeeName: deleteTarget?.employee_name,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
