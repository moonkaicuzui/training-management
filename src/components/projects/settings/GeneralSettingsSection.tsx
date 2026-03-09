/**
 * 일반 설정 섹션
 *
 * 프로젝트 이름/설명, 기본 보기, 알림 설정, 저장
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProjectSettings, updateProjectSettings } from '@/services/api';
import type { DefaultViewType, NotificationPreferences } from '@/types/project';

interface GeneralSettingsSectionProps {
  currentProjectId: string | null;
}

export function GeneralSettingsSection({ currentProjectId }: GeneralSettingsSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [generalSettings, setGeneralSettings] = useState({
    projectName: '',
    projectDescription: '',
    defaultView: 'list' as DefaultViewType,
    notifications: {
      taskAssigned: true,
      taskDue: true,
      taskOverdue: true,
      comments: true,
    } as NotificationPreferences,
  });
  const [isGeneralLoading, setIsGeneralLoading] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settingsId = currentProjectId || 'global';
      setIsGeneralLoading(true);
      try {
        const settings = await getProjectSettings(settingsId);
        setGeneralSettings({
          projectName: settings.projectName || '',
          projectDescription: settings.projectDescription || '',
          defaultView: settings.defaultView || 'list',
          notifications: settings.notifications || {
            taskAssigned: true,
            taskDue: true,
            taskOverdue: true,
            comments: true,
          },
        });
      } catch {
        // 기본값 유지
      } finally {
        setIsGeneralLoading(false);
      }
    };
    loadSettings();
  }, [currentProjectId]);

  const handleSaveGeneral = async () => {
    const settingsId = currentProjectId || 'global';
    setIsSavingGeneral(true);
    try {
      await updateProjectSettings(settingsId, generalSettings);
      toast({
        title: t('projects.settings.settingsSaved'),
        description: t('projects.settings.settingsSavedDesc'),
      });
    } catch {
      toast({
        title: t('common.error'),
        description: String(t('common.error')),
        variant: 'destructive',
      });
    } finally {
      setIsSavingGeneral(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('projects.settings.general')}</CardTitle>
        <CardDescription>
          {t('projects.settings.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isGeneralLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* 프로젝트 이름 */}
            <div className="space-y-2">
              <Label htmlFor="projectName">{t('projects.settings.projectName')}</Label>
              <Input
                id="projectName"
                value={generalSettings.projectName}
                onChange={(e) =>
                  setGeneralSettings({ ...generalSettings, projectName: e.target.value })
                }
                placeholder={t('projects.settings.projectName')}
              />
            </div>

            {/* 프로젝트 설명 */}
            <div className="space-y-2">
              <Label htmlFor="projectDescription">{t('projects.settings.projectDescription')}</Label>
              <Textarea
                id="projectDescription"
                value={generalSettings.projectDescription}
                onChange={(e) =>
                  setGeneralSettings({ ...generalSettings, projectDescription: e.target.value })
                }
                placeholder={t('projects.settings.projectDescription')}
                rows={3}
              />
            </div>

            {/* 기본 보기 */}
            <div className="space-y-2">
              <Label>{t('projects.settings.defaultView')}</Label>
              <Select
                value={generalSettings.defaultView}
                onValueChange={(value) =>
                  setGeneralSettings({
                    ...generalSettings,
                    defaultView: value as DefaultViewType,
                  })
                }
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">{t('projects.views.list')}</SelectItem>
                  <SelectItem value="board">{t('projects.views.board')}</SelectItem>
                  <SelectItem value="timeline">{t('projects.views.timeline')}</SelectItem>
                  <SelectItem value="calendar">{t('projects.views.calendar')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 알림 설정 */}
            <div className="space-y-4">
              <Label>{t('projects.settings.notifications')}</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('projects.settings.notifyTaskAssigned')}</span>
                  <Switch
                    checked={generalSettings.notifications.taskAssigned}
                    onCheckedChange={(checked) =>
                      setGeneralSettings({
                        ...generalSettings,
                        notifications: { ...generalSettings.notifications, taskAssigned: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('projects.settings.notifyTaskDue')}</span>
                  <Switch
                    checked={generalSettings.notifications.taskDue}
                    onCheckedChange={(checked) =>
                      setGeneralSettings({
                        ...generalSettings,
                        notifications: { ...generalSettings.notifications, taskDue: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('projects.settings.notifyTaskOverdue')}</span>
                  <Switch
                    checked={generalSettings.notifications.taskOverdue}
                    onCheckedChange={(checked) =>
                      setGeneralSettings({
                        ...generalSettings,
                        notifications: { ...generalSettings.notifications, taskOverdue: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('projects.settings.notifyComments')}</span>
                  <Switch
                    checked={generalSettings.notifications.comments}
                    onCheckedChange={(checked) =>
                      setGeneralSettings({
                        ...generalSettings,
                        notifications: { ...generalSettings.notifications, comments: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end">
              <Button onClick={handleSaveGeneral} disabled={isSavingGeneral}>
                {isSavingGeneral ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSavingGeneral ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
