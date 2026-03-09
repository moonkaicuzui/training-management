import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface RevokeDialogProps {
  open: boolean;
  onClose: () => void;
  revokeReason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
}

export default function RevokeDialog({
  open,
  onClose,
  revokeReason,
  onReasonChange,
  onConfirm,
}: RevokeDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('certificates.revokeConfirm')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('certificates.revokeWarning')}
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('certificates.revokeReason')}</label>
            <Input
              value={revokeReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={t('certificates.revokeReasonPlaceholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!revokeReason.trim()}
          >
            {t('certificates.revoke')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
