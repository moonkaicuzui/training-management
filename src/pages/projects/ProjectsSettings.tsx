/**
 * 프로젝트 설정 페이지
 *
 * 카테고리 관리, 자동화 규칙, 일반 설정, 위험 영역
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Tag, Zap, FolderCog, AlertTriangle } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { CategoryManagementSection } from '@/components/projects/settings/CategoryManagementSection';
import { AutomationSection } from '@/components/projects/settings/AutomationSection';
import { GeneralSettingsSection } from '@/components/projects/settings/GeneralSettingsSection';
import { DangerZoneSection } from '@/components/projects/settings/DangerZoneSection';

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
    automations,
    fetchAutomationsByProject,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    isAutomationsLoading,
    currentProjectId,
    updateProject,
  } = useProjectStore(useShallow((state) => ({
    categories: state.categories,
    error: state.error,
    fetchCategories: state.fetchCategories,
    createCategory: state.createCategory,
    updateCategory: state.updateCategory,
    deleteCategory: state.deleteCategory,
    isLoading: state.isLoading,
    automations: state.automations,
    fetchAutomationsByProject: state.fetchAutomationsByProject,
    createAutomation: state.createAutomation,
    updateAutomation: state.updateAutomation,
    deleteAutomation: state.deleteAutomation,
    toggleAutomation: state.toggleAutomation,
    isAutomationsLoading: state.isAutomationsLoading,
    currentProjectId: state.currentProjectId,
    updateProject: state.updateProject,
  })));

  const user = useAuthStore((s) => s.user);
  const initializedRef = useRef(false);

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

  const handleDeleteProject = async (projectId: string) => {
    await updateProject(projectId, { status: 'archived' });
  };

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
          <CategoryManagementSection
            categories={categories}
            isLoading={isLoading}
            onCreateCategory={createCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
          />
        </TabsContent>

        {/* 자동화 탭 */}
        <TabsContent value="automations">
          <AutomationSection
            automations={automations}
            isAutomationsLoading={isAutomationsLoading}
            isLoading={isLoading}
            currentProjectId={currentProjectId}
            userId={user?.id}
            onCreateAutomation={createAutomation}
            onUpdateAutomation={updateAutomation}
            onDeleteAutomation={deleteAutomation}
            onToggleAutomation={toggleAutomation}
          />
        </TabsContent>

        {/* 일반 설정 탭 */}
        <TabsContent value="general">
          <GeneralSettingsSection currentProjectId={currentProjectId} />
          <DangerZoneSection
            currentProjectId={currentProjectId}
            onDeleteProject={handleDeleteProject}
            onAfterDelete={() => navigate('/projects/dashboard')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
