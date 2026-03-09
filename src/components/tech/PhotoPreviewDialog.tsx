import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PhotoPreviewDialogProps {
  previewPhoto: string | null;
  onClose: () => void;
}

export function PhotoPreviewDialog({
  previewPhoto,
  onClose,
}: PhotoPreviewDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!previewPhoto} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl p-2">
        <DialogHeader className="sr-only">
          <DialogTitle>{t('tech.guidelines.photoPreview')}</DialogTitle>
        </DialogHeader>
        {previewPhoto && (
          <div className="flex items-center justify-center">
            <img
              src={previewPhoto}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
