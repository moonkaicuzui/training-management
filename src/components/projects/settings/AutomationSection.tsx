/**
 * 자동화 관리 섹션
 *
 * 자동화 규칙 목록, 생성/수정/삭제/복제/테스트
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Zap } from 'lucide-react';
import { AutomationList, AutomationDialog } from '@/components/projects/automation';
import type { AutomationFormData } from '@/components/projects/automation/constants';
import type { Automation } from '@/types/project';
import { useToast } from '@/hooks/use-toast';

type CreateAutomationData = Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'runCount' | 'lastRunAt'>;

interface AutomationSectionProps {
  automations: Automation[];
  isAutomationsLoading: boolean;
  isLoading: boolean;
  currentProjectId: string | null;
  userId: string | undefined;
  onCreateAutomation: (data: CreateAutomationData) => Promise<Automation>;
  onUpdateAutomation: (id: string, data: Partial<Automation>) => Promise<void>;
  onDeleteAutomation: (id: string) => Promise<void>;
  onToggleAutomation: (id: string) => void;
}

export function AutomationSection({
  automations,
  isAutomationsLoading,
  isLoading,
  currentProjectId,
  userId,
  onCreateAutomation,
  onUpdateAutomation,
  onDeleteAutomation,
  onToggleAutomation,
}: AutomationSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleToggleAutomation = useCallback((automationId: string) => {
    onToggleAutomation(automationId);
  }, [onToggleAutomation]);

  const openAutomationDialog = useCallback((automation?: Automation) => {
    setSelectedAutomation(automation || null);
    setIsAutomationDialogOpen(true);
  }, []);

  const handleSaveAutomation = useCallback(async (data: AutomationFormData, isEdit: boolean) => {
    if (!currentProjectId || !userId) return;

    try {
      const automationData = {
        name: data.name,
        description: data.description,
        trigger: {
          type: data.triggerType,
          conditions: data.triggerConditions.fromStatus || data.triggerConditions.toStatus || data.triggerConditions.progressThreshold
            ? [
                ...(data.triggerConditions.fromStatus ? [{ field: 'fromStatus' as const, operator: 'equals' as const, value: data.triggerConditions.fromStatus }] : []),
                ...(data.triggerConditions.toStatus ? [{ field: 'toStatus' as const, operator: 'equals' as const, value: data.triggerConditions.toStatus }] : []),
                ...(data.triggerConditions.progressThreshold ? [{ field: 'progress' as const, operator: 'greater_than' as const, value: data.triggerConditions.progressThreshold }] : []),
              ]
            : undefined,
          schedule: data.triggerConditions.daysBefore
            ? { daysBefore: data.triggerConditions.daysBefore }
            : undefined,
        },
        actions: data.actions,
      };

      if (isEdit && selectedAutomation) {
        await onUpdateAutomation(selectedAutomation.id, automationData);
      } else {
        await onCreateAutomation({
          ...automationData,
          projectId: currentProjectId,
          isActive: false,
          createdBy: userId,
        });
      }
      setIsAutomationDialogOpen(false);
      setSelectedAutomation(null);
    } catch {
      // 에러는 스토어에서 처리
    }
  }, [currentProjectId, userId, selectedAutomation, onCreateAutomation, onUpdateAutomation]);

  const handleDeleteAutomation = useCallback((automationId: string) => {
    setDeleteTargetId(automationId);
  }, []);

  const handleConfirmDeleteAutomation = useCallback(async () => {
    if (deleteTargetId) {
      await onDeleteAutomation(deleteTargetId);
      setDeleteTargetId(null);
    }
  }, [deleteTargetId, onDeleteAutomation]);

  const handleDuplicateAutomation = useCallback(async (automation: Automation) => {
    if (!currentProjectId) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, runCount, lastRunAt, ...automationData } = automation;
      await onCreateAutomation({
        ...automationData,
        name: `${automation.name} (${t('projects.settings.copy')})`,
        projectId: currentProjectId,
        isActive: false,
      });
    } catch {
      // 에러는 스토어에서 처리
    }
  }, [currentProjectId, onCreateAutomation, t]);

  const handleTestAutomation = useCallback((automation: Automation) => {
    toast({
      title: t('projects.settings.testNotReady'),
      description: t('projects.settings.futureUpdate'),
    });

    onUpdateAutomation(automation.id, {
      runCount: (automation.runCount || 0) + 1,
    });
  }, [onUpdateAutomation, toast, t]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('projects.settings.automation')}</CardTitle>
            <CardDescription>
              {t('projects.settings.automation')}
            </CardDescription>
          </div>
          <Button onClick={() => openAutomationDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            {t('projects.settings.automation')}
          </Button>
        </CardHeader>
        <CardContent>
          {automations.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {t('common.noData')}
              </p>
              {currentProjectId && (
                <Button onClick={() => openAutomationDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('projects.settings.automation')}
                </Button>
              )}
            </div>
          ) : (
            <AutomationList
              automations={automations}
              onToggle={handleToggleAutomation}
              onEdit={openAutomationDialog}
              onDelete={handleDeleteAutomation}
              onDuplicate={handleDuplicateAutomation}
              onTest={handleTestAutomation}
              isLoading={isAutomationsLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* 자동화 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('projects.settings.deleteAutomationConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAutomation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 자동화 추가/수정 다이얼로그 */}
      <AutomationDialog
        open={isAutomationDialogOpen}
        onOpenChange={setIsAutomationDialogOpen}
        automation={selectedAutomation}
        onSave={handleSaveAutomation}
        isLoading={isLoading}
      />
    </>
  );
}
