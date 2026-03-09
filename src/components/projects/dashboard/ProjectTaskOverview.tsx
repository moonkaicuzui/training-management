/**
 * 과제 현황 + 긴급 알림 섹션
 *
 * 상태별 진행 바 + 긴급 과제 리스트
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ArrowRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/types/project';
import type { TaskStatus, Task } from '@/types/project';

interface ProjectTaskOverviewProps {
  tasks: Task[];
  urgentTasks: Task[];
  taskStats: {
    total: number;
  };
  statusLabels: Record<TaskStatus, string>;
}

export function ProjectTaskOverview({
  tasks,
  urgentTasks,
  taskStats,
  statusLabels,
}: ProjectTaskOverviewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
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
            {(['todo', 'in_progress', 'delayed_start', 'delayed_complete', 'review', 'done'] as TaskStatus[]).map((status) => {
              const count = tasks.filter((t) => t.status === status).length;
              const percentage = taskStats.total > 0 ? (count / taskStats.total) * 100 : 0;

              return (
                <div key={status} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium">{statusLabels[status]}</div>
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
            {t('projects.dashboard.urgentTasks')}
          </CardTitle>
          <Badge variant="destructive">{urgentTasks.length}</Badge>
        </CardHeader>
        <CardContent>
          {urgentTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={t('projects.dashboard.urgentEmptyTitle')}
              description={t('projects.dashboard.urgentEmptyDesc')}
            />
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
                        {statusLabels[task.status]}
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
  );
}
