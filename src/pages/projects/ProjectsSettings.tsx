/**
 * 프로젝트 설정 페이지
 *
 * 카테고리 관리, 자동화 규칙, 프로젝트 설정
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Plus,
  Tag,
  Trash2,
  Edit,
  Zap,
  FolderCog,
  AlertTriangle,
  Loader2,
  Save,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { CATEGORY_COLORS } from '@/types/project';
import type { Category, Automation, DefaultViewType, NotificationPreferences } from '@/types/project';
import { AutomationList, AutomationDialog } from '@/components/projects/automation';
import type { AutomationFormData } from '@/components/projects/automation/constants';
import { getProjectSettings, updateProjectSettings } from '@/services/api';

export default function ProjectsSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    categories,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
    // 자동화 관련
    automations,
    fetchAutomationsByProject,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    isAutomationsLoading,
    currentProjectId,
    updateProject,
  } = useProjectStore();

  const { user } = useAuthStore();
  const { toast } = useToast();

  const initializedRef = useRef(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: CATEGORY_COLORS[0],
    type: 'task' as 'event' | 'task',
    icon: '',
  });

  // 자동화 관련 상태
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);

  // 일반 설정 관련 상태
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const fetches: Promise<void>[] = [fetchCategories()];
      if (currentProjectId) {
        fetches.push(fetchAutomationsByProject(currentProjectId));
      }
      Promise.all(fetches);
    }
  }, [fetchCategories, fetchAutomationsByProject, currentProjectId]);

  // 일반 설정 로드
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

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      color: CATEGORY_COLORS[0],
      type: 'task',
      icon: '',
    });
    setSelectedCategory(null);
  };

  // 다이얼로그 열기
  const openDialog = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        color: category.color,
        type: category.type,
        icon: category.icon || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  // 카테고리 저장
  const handleSave = async () => {
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, formData);
      } else {
        await createCategory(formData.name, formData.color, formData.type, formData.icon || undefined);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch {
      // 에러는 스토어에서 처리
    }
  };

  // 카테고리 삭제
  const handleDelete = async (categoryId: string) => {
    if (confirm('이 카테고리를 삭제하시겠습니까?')) {
      await deleteCategory(categoryId);
    }
  };

  // ============================================================
  // 자동화 관련 함수들
  // ============================================================

  // 자동화 활성화/비활성화 토글
  const handleToggleAutomation = useCallback((automationId: string) => {
    toggleAutomation(automationId);
  }, [toggleAutomation]);

  // 자동화 다이얼로그 열기
  const openAutomationDialog = useCallback((automation?: Automation) => {
    setSelectedAutomation(automation || null);
    setIsAutomationDialogOpen(true);
  }, []);

  // 자동화 저장
  const handleSaveAutomation = useCallback(async (data: AutomationFormData, isEdit: boolean) => {
    if (!currentProjectId || !user) return;

    try {
      // AutomationFormData를 Automation 형식으로 변환
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
        // 수정
        await updateAutomation(selectedAutomation.id, automationData);
      } else {
        // 생성
        await createAutomation({
          ...automationData,
          projectId: currentProjectId,
          isActive: false,
          createdBy: user.id,
        });
      }
      setIsAutomationDialogOpen(false);
      setSelectedAutomation(null);
    } catch {
      // 에러는 스토어에서 처리
    }
  }, [currentProjectId, user, selectedAutomation, createAutomation, updateAutomation]);

  // 자동화 삭제
  const handleDeleteAutomation = useCallback(async (automationId: string) => {
    if (confirm('이 자동화 규칙을 삭제하시겠습니까?')) {
      await deleteAutomation(automationId);
    }
  }, [deleteAutomation]);

  // 자동화 복제
  const handleDuplicateAutomation = useCallback(async (automation: Automation) => {
    if (!currentProjectId) return;

    try {
      // id 및 메타데이터를 제외한 속성만 복사
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, runCount, lastRunAt, ...automationData } = automation;
      await createAutomation({
        ...automationData,
        name: `${automation.name} (복사본)`,
        projectId: currentProjectId,
        isActive: false,
      });
    } catch {
      // 에러는 스토어에서 처리
    }
  }, [currentProjectId, createAutomation]);

  // 프로젝트 삭제 (아카이브)
  const handleDeleteProject = async () => {
    if (!currentProjectId) return;
    setIsDeletingProject(true);
    try {
      await updateProject(currentProjectId, { status: 'archived' });
      toast({
        title: t('projects.settings.projectDeleted'),
        description: t('projects.settings.projectDeletedDesc'),
      });
      setIsDeleteDialogOpen(false);
      navigate('/projects/dashboard');
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

  // 일반 설정 저장
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

  // 자동화 테스트 실행
  const handleTestAutomation = useCallback((automation: Automation) => {
    // 테스트 실행 시뮬레이션
    toast({
      title: t('projects.settings.testNotReady'),
      description: t('projects.settings.futureUpdate'),
    });

    // 실행 횟수 증가 (선택적)
    updateAutomation(automation.id, {
      runCount: (automation.runCount || 0) + 1,
      lastRunAt: new Date(),
    });
  }, [updateAutomation]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          {t('projects.settings.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('projects.settings.description')}
        </p>
      </div>

      {/* 에러 배너 */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {t('projects.settings.categories')}
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {t('projects.settings.automation')}
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <FolderCog className="h-4 w-4" />
            {t('projects.settings.general')}
          </TabsTrigger>
        </TabsList>

        {/* 카테고리 탭 */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('projects.settings.categories')}</CardTitle>
                <CardDescription>
                  {t('projects.settings.categories')}
                </CardDescription>
              </div>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                {t('projects.settings.addCategory')}
              </Button>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">{t('common.noData')}</p>
                  <Button onClick={() => openDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('projects.settings.addCategory')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="outline">
                          {category.type === 'task' ? t('projects.tasks.title') : t('projects.calendar.title')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(category)}
                          title={t('common.edit')}
                          aria-label={t('projects.settings.editCategory')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                          title={t('common.delete')}
                          aria-label={t('projects.settings.deleteCategory')}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 자동화 탭 */}
        <TabsContent value="automations">
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
                    {!currentProjectId
                      ? t('common.noData')
                      : t('common.noData')}
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
        </TabsContent>

        {/* 일반 설정 탭 */}
        <TabsContent value="general">
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

                  {/* 프로젝트 삭제 영역 */}
                  {currentProjectId && (
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
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 카테고리 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? t('projects.settings.editCategory') : t('projects.settings.addCategory')}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? t('projects.settings.editCategory')
                : t('projects.settings.addCategory')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('projects.settings.categoryName')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('projects.settings.categoryName')}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('projects.settings.categoryColor')}</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      formData.color === color
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t('projects.tasks.category')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as 'event' | 'task' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">{t('projects.tasks.title')}</SelectItem>
                  <SelectItem value="event">{t('projects.calendar.title')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || isLoading}>
              {isLoading ? t('common.saving') : selectedCategory ? t('common.edit') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 자동화 추가/수정 다이얼로그 */}
      <AutomationDialog
        open={isAutomationDialogOpen}
        onOpenChange={setIsAutomationDialogOpen}
        automation={selectedAutomation}
        onSave={handleSaveAutomation}
        isLoading={isLoading}
      />

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
    </div>
  );
}
