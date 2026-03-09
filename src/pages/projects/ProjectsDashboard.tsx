/**
 * 프로젝트 관리 대시보드 페이지
 *
 * 프로젝트 현황, 긴급 알림, 팀 성과, 최근 활동 표시
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  AlertTriangle,
  Plus,
  FolderPlus,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useProjectStore } from '@/stores/projectStore';
import type { TaskStatus } from '@/types/project';
import { ProjectKPICards } from '@/components/projects/dashboard/ProjectKPICards';
import { ProjectTaskOverview } from '@/components/projects/dashboard/ProjectTaskOverview';
import { ProjectMyTasks } from '@/components/projects/dashboard/ProjectMyTasks';
import { ProjectQuickActions } from '@/components/projects/dashboard/ProjectQuickActions';
import {
  CreateProjectDialog,
  CompletionDetailDialog,
  DelayedDetailDialog,
  ProjectListDialog,
} from '@/components/projects/dashboard/ProjectDashboardDialogs';

export default function ProjectsDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const STATUS_LABELS: Record<TaskStatus, string> = {
    todo: t('projects.status.planned'),
    in_progress: t('projects.status.inProgress'),
    delayed_start: t('projects.status.delayedStart'),
    delayed_complete: t('projects.status.delayedCompletion'),
    review: t('projects.status.underReview'),
    done: t('projects.status.completed'),
  };

  const {
    members,
    projects,
    tasks,
    error,
    fetchMembers,
    fetchProjects,
    fetchAllTasks,
    createProject,
    isMembersLoading,
    isProjectsLoading,
    isLoading: isStoreLoading,
    subscribeMembersRealtime,
    subscribeProjectsRealtime,
    linkCurrentUser,
    currentUserMember,
    fetchMyTasks,
    selectProject,
  } = useProjectStore(useShallow((state) => ({
    members: state.members,
    projects: state.projects,
    tasks: state.tasks,
    error: state.error,
    fetchMembers: state.fetchMembers,
    fetchProjects: state.fetchProjects,
    fetchAllTasks: state.fetchAllTasks,
    createProject: state.createProject,
    isMembersLoading: state.isMembersLoading,
    isProjectsLoading: state.isProjectsLoading,
    isLoading: state.isLoading,
    subscribeMembersRealtime: state.subscribeMembersRealtime,
    subscribeProjectsRealtime: state.subscribeProjectsRealtime,
    linkCurrentUser: state.linkCurrentUser,
    currentUserMember: state.currentUserMember,
    fetchMyTasks: state.fetchMyTasks,
    selectProject: state.selectProject,
  })));

  const initializedRef = useRef(false);
  const cleanup = useProjectStore((s) => s.cleanup);

  // 다이얼로그 상태
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  const [isCompletionDetailOpen, setIsCompletionDetailOpen] = useState(false);
  const [isDelayedDetailOpen, setIsDelayedDetailOpen] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await createProject(newProjectName.trim(), newProjectDescription.trim());
      setIsCreateProjectOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
    } catch {
      // error handled by store
    }
  };

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      Promise.all([
        fetchMembers().then(() => linkCurrentUser()),
        fetchProjects(),
        fetchAllTasks(),
      ]);
      subscribeMembersRealtime();
      subscribeProjectsRealtime();
    }
    return () => {
      cleanup();
    };
  }, [fetchMembers, fetchProjects, fetchAllTasks, subscribeMembersRealtime, subscribeProjectsRealtime, linkCurrentUser, cleanup]);

  // 통계 계산
  const activeMembers = members.filter((m) => m.status === 'active');
  const activeProjects = projects.filter((p) => p.status === 'active');

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    delayed: tasks.filter((t) => t.status === 'delayed_start' || t.status === 'delayed_complete').length,
    delayedStart: tasks.filter((t) => t.status === 'delayed_start').length,
    delayedComplete: tasks.filter((t) => t.status === 'delayed_complete').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const completionRate = taskStats.total > 0
    ? Math.round((taskStats.done / taskStats.total) * 100)
    : 0;

  const urgentTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => {
      if (task.status === 'delayed_start' || task.status === 'delayed_complete') return true;
      if (task.dueDate) {
        const dueDate = task.dueDate instanceof Date ? task.dueDate : task.dueDate.toDate();
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 3 && daysUntilDue >= 0 && task.status !== 'done';
      }
      return false;
    });
  }, [tasks]);

  const isLoading = isMembersLoading || isProjectsLoading;

  if (isLoading && members.length === 0 && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            {t('projects.dashboard.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('projects.dashboard.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateProjectOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            {t('projects.dashboard.newProject')}
          </Button>
          <Button onClick={() => navigate('/projects/tasks')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('projects.newTask')}
          </Button>
        </div>
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

      {/* KPI 카드 */}
      <ProjectKPICards
        activeMembersCount={activeMembers.length}
        activeProjectsCount={activeProjects.length}
        completionRate={completionRate}
        taskStats={taskStats}
        onMembersClick={() => navigate('/projects/members')}
        onProjectsClick={() => setIsProjectListOpen(true)}
        onCompletionClick={() => setIsCompletionDetailOpen(true)}
        onDelayedClick={() => setIsDelayedDetailOpen(true)}
      />

      {/* 과제 현황 + 긴급 알림 */}
      <ProjectTaskOverview
        tasks={tasks}
        urgentTasks={urgentTasks}
        taskStats={taskStats}
        statusLabels={STATUS_LABELS}
      />

      {/* 내 과제 */}
      {currentUserMember && (
        <ProjectMyTasks
          myTasks={fetchMyTasks()}
          statusLabels={STATUS_LABELS}
        />
      )}

      {/* 퀵 액션 */}
      <ProjectQuickActions />

      {/* 다이얼로그 */}
      <CreateProjectDialog
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        projectName={newProjectName}
        onProjectNameChange={setNewProjectName}
        projectDescription={newProjectDescription}
        onProjectDescriptionChange={setNewProjectDescription}
        onSubmit={handleCreateProject}
        isLoading={isStoreLoading}
      />

      <CompletionDetailDialog
        open={isCompletionDetailOpen}
        onOpenChange={setIsCompletionDetailOpen}
        completionRate={completionRate}
        taskStats={taskStats}
        projects={projects}
        tasks={tasks}
      />

      <DelayedDetailDialog
        open={isDelayedDetailOpen}
        onOpenChange={setIsDelayedDetailOpen}
        tasks={tasks}
        projects={projects}
        members={members}
        statusLabels={STATUS_LABELS}
      />

      <ProjectListDialog
        open={isProjectListOpen}
        onOpenChange={setIsProjectListOpen}
        projects={projects}
        tasks={tasks}
        onSelectProject={selectProject}
        onCreateProject={() => setIsCreateProjectOpen(true)}
      />
    </div>
  );
}
