import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MaterialFolder } from '@/types/material';

interface MaterialUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialUploadDialog({
  open,
  onOpenChange,
}: MaterialUploadDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('materials.uploadTitle')}</DialogTitle>
          <DialogDescription>
            {t('materials.uploadDesc')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  onFolderNameChange: (name: string) => void;
  parentFolderId: string | null;
  onParentFolderChange: (id: string | null) => void;
  folders: MaterialFolder[];
  onCreateFolder: () => void;
  onClose: () => void;
}

export function NewFolderDialog({
  open,
  onOpenChange,
  folderName,
  onFolderNameChange,
  parentFolderId,
  onParentFolderChange,
  folders,
  onCreateFolder,
  onClose,
}: NewFolderDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('materials.newFolderTitle')}</DialogTitle>
          <DialogDescription>
            {t('materials.newFolderDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('materials.folderName')}</Label>
            <Input
              placeholder={t('materials.folderNamePlaceholder')}
              value={folderName}
              onChange={(e) => onFolderNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('materials.parentFolder')}</Label>
            <Select
              value={parentFolderId ?? 'root'}
              onValueChange={(val) => onParentFolderChange(val === 'root' ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('materials.selectParentFolder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">{t('materials.rootFolder')}</SelectItem>
                {folders.filter(f => !f.parentId).map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onCreateFolder} disabled={!folderName.trim()}>
            {t('materials.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
