import { useTranslation } from 'react-i18next';
import { Clock, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TrainingMaterial } from '@/types/material';
import { formatFileSize, getFileIcon, getFileIconColor } from './materialUtils';

interface MaterialDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: TrainingMaterial | null;
}

export function MaterialDetailDialog({
  open,
  onOpenChange,
  material,
}: MaterialDetailDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('materials.detailTitle')}</DialogTitle>
        </DialogHeader>
        {material && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {(() => {
                const FileIcon = getFileIcon(material.type);
                return <FileIcon className={`h-12 w-12 ${getFileIconColor(material.type)}`} />;
              })()}
              <div>
                <h3 className="font-medium text-lg">{material.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {material.version} · {formatFileSize(material.size)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">{t('materials.detailUploader')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p>{material.uploadedBy}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('materials.detailUploadDate')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p>{material.uploadedAt.split('T')[0]}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('materials.detailDownloadCount')}</Label>
                <p className="mt-1">{t('materials.detailDownloadUnit', { count: material.downloadCount })}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('materials.detailVisibility')}</Label>
                <p className="mt-1">{material.isPublic ? t('materials.detailPublic') : t('materials.detailPrivate')}</p>
              </div>
            </div>

            {material.programName && (
              <div>
                <Label className="text-muted-foreground">{t('materials.detailLinkedProgram')}</Label>
                <p className="mt-1">{material.programName}</p>
              </div>
            )}

            <div>
              <Label className="text-muted-foreground">{t('materials.detailTags')}</Label>
              <div className="flex gap-2 mt-2">
                {material.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">{t('materials.detailDescription')}</Label>
              <p className="mt-1 p-3 bg-muted rounded-lg">
                {material.description}
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
