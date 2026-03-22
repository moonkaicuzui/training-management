/**
 * 프로젝트 대시보드 다이얼로그 모음
 *
 * 프로젝트 생성, 완료 현황, 지연 과제, 프로젝트 목록 모달
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { TASK_STATUS_COLORS } from '@/types/project';
import type { TaskStatus, Task, Project, ProjectMember } from '@/types/project';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  projectDescription: string;
  onProjectDescriptionChange: (desc: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  projectName,
  onProjectNameChange,
  projectDescription,
  onProjectDescriptionChange,
  onSubmit,
  isLoading,
}: CreateProjectDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder={t('projects.dashboard.newProject')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-desc">{t('projects.description')}</Label>
            <Textarea
              id="project-desc"
              value={projectDescription}
              onChange={(e) => onProjectDescriptionChange(e.target.value)}
              placeholder={t('projects.description')}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={!projectName.trim() || isLoading}>
            {isLoading ? t('common.saving') : t('common.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CompletionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completionRate: number;
  taskStats: { done: number; total: number };
  projects: Project[];
  tasks: Task[];
}

export function CompletionDetailDialog({
  open,
  onOpenChange,
  completionRate,
  taskStats,
  projects,
  tasks,
}: CompletionDetailDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            {t('projects.dashboard.completionDetail')}
          </DialogTitle>
          <DialogDescription>{t('projects.dashboard.completionDetailDesc')}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('projects.dashboard.overallProgress')}</span>
              <span className="text-2xl font-bold">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {taskStats.done}/{taskStats.total} {t('projects.dashboard.completedTasks')}
            </p>
          </div>

          <div className="space-y-3">
            {projects.map((project: Project) => {
              const projectTasks = tasks.filter((t) => t.projectId === project.id);
              const doneTasks = projectTasks.filter((t) => t.status === 'done').length;
              const totalTasks = projectTasks.length;
              const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

              return (
                <div key={project.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{project.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Progress value={progress} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {doneTasks}/{totalTasks}
                      </span>
                    </div>
                  </div>
                  <div className="text-right w-14">
                    <span className="text-lg font-bold">{progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DelayedDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  projects: Project[];
  members: ProjectMember[];
  statusLabels: Record<TaskStatus, string>;
}

export const DelayedDetailDialog = memo(function DelayedDetailDialog({
  open,
  onOpenChange,
  tasks,
  projects,
  members,
  statusLabels,
}: DelayedDetailDialogProps) {
  const { t } = useTranslation();

  const delayedTasks = tasks.filter(
    (t) => t.status === 'delayed_start' || t.status === 'delayed_complete'
  );

  const grouped = delayedTasks.reduce<Record<string, Task[]>>((acc, task) => {
    const projectId = task.projectId || 'unassigned';
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(task);
    return acc;
  }, {});

  const now = new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {t('projects.dashboard.delayedDetail')}
          </DialogTitle>
          <DialogDescription>{t('projects.dashboard.delayedDetailDesc')}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh]">
          {delayedTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p>{t('projects.dashboard.noDelayedTasks')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([projectId, groupTasks]) => {
                const project = projects.find((p) => p.id === projectId);
                return (
                  <div key={projectId}>
                    <h4 className="font-medium text-sm mb-2 text-muted-foreground">
                      {project?.name || t('projects.tasks.unassigned')}
                    </h4>
                    <div className="space-y-2">
                      {groupTasks.map((task) => {
                        const dueDate = task.dueDate
                          ? (task.dueDate instanceof Date ? task.dueDate : (task.dueDate as { toDate: () => Date }).toDate())
                          : null;
                        const daysOver = dueDate
                          ? Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
                          : 0;
                        const assigneeNames = task.assignees
                          ?.map((aId) => members.find((m) => m.id === aId)?.name)
                          .filter(Boolean)
                          .join(', ');

                        return (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{task.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                  style={{
                                    borderColor: TASK_STATUS_COLORS[task.status],
                                    color: TASK_STATUS_COLORS[task.status],
                                  }}
                                >
                                  {statusLabels[task.status]}
                                </Badge>
                                {dueDate && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {dueDate.toLocaleDateString()}
                                  </span>
                                )}
                                {daysOver > 0 && (
                                  <Badge variant="destructive" className="text-[10px]">
                                    {t('projects.dashboard.daysOverdue', { n: daysOver })}
                                  </Badge>
                                )}
                                {assigneeNames && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {assigneeNames}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

interface ProjectListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  tasks: Task[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
}

export function ProjectListDialog({
  open,
  onOpenChange,
  projects,
  tasks,
  onSelectProject,
  onCreateProject,
}: ProjectListDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <EmptyState
              icon={FolderOpen}
              title={t('projects.dashboard.noProjects')}
              description={t('projects.dashboard.projectListEmptyDesc')}
              actionLabel={t('projects.dashboard.newProject')}
              onAction={() => {
                onOpenChange(false);
                onCreateProject();
              }}
            />
          ) : (
            <div className="space-y-3">
              {projects.map((project: Project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const doneTasks = projectTasks.filter((t) => t.status === 'done').length;
                const totalTasks = projectTasks.length;
                const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      onSelectProject(project.id);
                      onOpenChange(false);
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
  );
}
