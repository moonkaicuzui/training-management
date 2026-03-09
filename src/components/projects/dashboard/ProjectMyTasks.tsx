/**
 * 내 과제 섹션
 *
 * 현재 사용자에게 할당된 과제 리스트
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Users, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/types/project';
import type { TaskStatus, Task } from '@/types/project';

interface ProjectMyTasksProps {
  myTasks: Task[];
  statusLabels: Record<TaskStatus, string>;
}

export function ProjectMyTasks({ myTasks, statusLabels }: ProjectMyTasksProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
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
        {myTasks.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={t('projects.dashboard.noMyTasks')}
            description={t('projects.dashboard.noMyTasksDesc')}
            actionLabel={t('projects.newTask')}
            onAction={() => navigate('/projects/tasks')}
          />
        ) : (
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
                      {statusLabels[task.status]}
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
        )}
      </CardContent>
    </Card>
  );
}
