/**
 * 위험 영역 섹션
 *
 * 프로젝트 삭제(아카이브) 기능
 */

import { useState } from 'react';
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
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DangerZoneSectionProps {
  currentProjectId: string | null;
  onDeleteProject: (projectId: string) => Promise<void>;
  onAfterDelete: () => void;
}

export function DangerZoneSection({
  currentProjectId,
  onDeleteProject,
  onAfterDelete,
}: DangerZoneSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  if (!currentProjectId) return null;

  const handleDeleteProject = async () => {
    setIsDeletingProject(true);
    try {
      await onDeleteProject(currentProjectId);
      toast({
        title: t('projects.settings.projectDeleted'),
        description: t('projects.settings.projectDeletedDesc'),
      });
      setIsDeleteDialogOpen(false);
      onAfterDelete();
    } catch {
      toast({
        title: t('common.error'),
        description: t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setIsDeletingProject(false);
    }
  };

  return (
    <>
      <div className="border-t pt-6 mt-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t('projects.settings.dangerZone')}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {t('projects.settings.deleteProjectWarning')}
          </p>
          <Button
            variant="destructive"
            className="mt-4"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('projects.settings.deleteProject')}
          </Button>
        </div>
      </div>

      {/* 프로젝트 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t('projects.settings.deleteProject')}
            </DialogTitle>
            <DialogDescription>
              {t('projects.settings.deleteProjectConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeletingProject}
            >
              {isDeletingProject ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
