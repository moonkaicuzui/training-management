/**
 * 프로젝트 관리 대시보드 페이지
 *
 * 프로젝트 현황, 긴급 알림, 팀 성과, 최근 활동 표시
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Calendar,
  TrendingUp,
  FolderPlus,
  FolderOpen,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/types/project';
import type { TaskStatus, Project } from '@/types/project';

export default function ProjectsDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 상태별 라벨
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
  } = useProjectStore();

  // Use ref to prevent double initialization (anti-pattern fix)
  const initializedRef = useRef(false);

  // 프로젝트 생성 다이얼로그 상태
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  // 프로젝트 목록 모달 상태
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);

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

  const { cleanup } = useProjectStore();

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
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const completionRate = taskStats.total > 0
    ? Math.round((taskStats.done / taskStats.total) * 100)
    : 0;

  // 긴급 과제 (마감 3일 이내 또는 지연)
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

  // Show loading only if actively fetching AND no data loaded yet
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

      {/* 통계 카드 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/projects/members')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('projects.members.title')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
            <p className="text-xs text-muted-foreground">{t('projects.members.activeMembers')}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setIsProjectListOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('projects.title')}</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">{t('projects.dashboard.inProgressTasks')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('projects.dashboard.completedTasks')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('projects.dashboard.overdueTasks')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{taskStats.delayed}</div>
            <p className="text-xs text-muted-foreground">{t('projects.dashboard.overdueTasks')}</p>
          </CardContent>
        </Card>
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 과제 현황 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('projects.dashboard.projectProgress')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects/tasks')}>
              {t('common.viewAll')} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(['todo', 'in_progress', 'delayed_start', 'delayed_complete', 'done'] as TaskStatus[]).map((status) => {
                const count = tasks.filter((t) => t.status === status).length;
                const percentage = taskStats.total > 0 ? (count / taskStats.total) * 100 : 0;

                return (
                  <div key={status} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium">{STATUS_LABELS[status]}</div>
                    <div className="flex-1">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: TASK_STATUS_COLORS[status],
                          minWidth: count > 0 ? '8px' : '0',
                        }}
                      />
                    </div>
                    <div className="w-8 text-right text-sm text-muted-foreground">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 긴급 알림 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t('projects.dashboard.recentActivity')}
            </CardTitle>
            <Badge variant="destructive">{urgentTasks.length}</Badge>
          </CardHeader>
          <CardContent>
            {urgentTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>{t('projects.tasks.noTasks')}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {urgentTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => navigate('/projects/tasks')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: TASK_STATUS_COLORS[task.status],
                            color: TASK_STATUS_COLORS[task.status],
                          }}
                        >
                          {STATUS_LABELS[task.status]}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {(task.dueDate instanceof Date
                              ? task.dueDate
                              : task.dueDate.toDate()
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      style={{
                        backgroundColor: TASK_PRIORITY_COLORS[task.priority],
                      }}
                    >
                      {task.priority === 'urgent' ? t('projects.priority.urgent') : task.priority === 'high' ? t('projects.priority.high') : t('projects.priority.medium')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 내 과제 */}
      {currentUserMember && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              {t('projects.dashboard.myTasks')}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects/tasks')}>
              {t('common.viewAll')} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {(() => {
              const myTasks = fetchMyTasks();
              if (myTasks.length === 0) {
                return (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">{t('projects.dashboard.noMyTasks')}</p>
                  </div>
                );
              }
              return (
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {myTasks.filter((t) => t.status !== 'done').slice(0, 8).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => navigate('/projects/tasks')}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                            style={{
                              borderColor: TASK_STATUS_COLORS[task.status],
                              color: TASK_STATUS_COLORS[task.status],
                            }}
                          >
                            {STATUS_LABELS[task.status]}
                          </Badge>
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {(task.dueDate instanceof Date
                                ? task.dueDate
                                : (task.dueDate as { toDate: () => Date }).toDate()
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        className="text-[10px]"
                        style={{ backgroundColor: TASK_PRIORITY_COLORS[task.priority] }}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* 퀵 액션 */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/projects/members')}
        >
          <Users className="h-6 w-6" />
          <span>{t('projects.members.title')}</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/projects/tasks')}
        >
          <CheckCircle2 className="h-6 w-6" />
          <span>{t('projects.tasks.title')}</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/projects/calendar')}
        >
          <Calendar className="h-6 w-6" />
          <span>{t('projects.calendar.title')}</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/projects/settings')}
        >
          <TrendingUp className="h-6 w-6" />
          <span>{t('projects.settings.title')}</span>
        </Button>
      </div>

      {/* 프로젝트 생성 다이얼로그 */}
      <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('projects.dashboard.newProject')}</DialogTitle>
            <DialogDescription>{t('projects.dashboard.newProjectDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">{t('projects.title')} *</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={t('projects.dashboard.newProject')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-desc">{t('projects.description')}</Label>
              <Textarea
                id="project-desc"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder={t('projects.description')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateProjectOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim() || isStoreLoading}>
              {isStoreLoading ? t('common.saving') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 프로젝트 목록 모달 */}
      <Dialog open={isProjectListOpen} onOpenChange={setIsProjectListOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              {t('projects.dashboard.projectList')}
            </DialogTitle>
            <DialogDescription>{t('projects.dashboard.projectListDesc')}</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            {projects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('projects.dashboard.noProjects')}</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setIsProjectListOpen(false);
                    setIsCreateProjectOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('projects.dashboard.newProject')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project: Project) => {
                  const projectTasks = tasks.filter((t) =>
                    t.projectId === project.id
                  );
                  const doneTasks = projectTasks.filter((t) => t.status === 'done').length;
                  const totalTasks = projectTasks.length;
                  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        selectProject(project.id);
                        setIsProjectListOpen(false);
                        navigate('/projects/tasks');
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{project.name}</h3>
                          <Badge
                            variant={project.status === 'active' ? 'default' : 'secondary'}
                          >
                            {project.status === 'active'
                              ? t('projects.status.inProgress')
                              : project.status === 'completed'
                                ? t('projects.status.completed')
                                : t('common.inactive')}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {t('projects.dashboard.memberCount')}: {project.members?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {doneTasks}/{totalTasks} {t('projects.dashboard.completedTasks')}
                          </span>
                          {project.createdAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {t('projects.dashboard.createdAt')}: {(project.createdAt instanceof Date
                                ? project.createdAt
                                : (project.createdAt as { toDate: () => Date }).toDate()
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 w-16 text-right">
                        <div className="text-lg font-bold">{progress}%</div>
                        <Progress value={progress} className="h-1.5 mt-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
