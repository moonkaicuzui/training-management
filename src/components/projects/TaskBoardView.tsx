/**
 * Task Board View (Kanban) Component
 * Drag & drop board with status columns
 */

import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/types/project';
import type { Task, TaskStatus } from '@/types/project';

interface TaskBoardViewProps {
  tasks: Task[];
  statusLabels: Record<TaskStatus, string>;
  getProjectById: (id: string) => { name: string } | undefined;
  getMemberById: (id: string) => { name: string } | undefined;
  draggedTaskId: string | null;
  dragOverStatus: TaskStatus | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, status: TaskStatus) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

const BOARD_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'delayed_complete', 'done'];

export function TaskBoardView({
  tasks,
  statusLabels,
  getProjectById,
  getMemberById,
  draggedTaskId,
  dragOverStatus,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onTaskClick,
}: TaskBoardViewProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {BOARD_STATUSES.map((status) => {
        const statusTasks = tasks.filter((t) => t.status === status);
        const isDragOver = dragOverStatus === status;
        return (
          <div
            key={status}
            className="space-y-2"
            onDragOver={(e) => onDragOver(e, status)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, status)}
          >
            <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TASK_STATUS_COLORS[status] }}
                />
                <span className="font-medium text-sm">{statusLabels[status]}</span>
              </div>
              <Badge variant="secondary">{statusTasks.length}</Badge>
            </div>
            <div
              className={`space-y-2 min-h-[200px] rounded-lg p-1 transition-colors ${
                isDragOver ? 'bg-primary/10 ring-2 ring-primary/30' : ''
              }`}
            >
              {statusTasks.map((task) => {
                const isDragging = draggedTaskId === task.id;
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => onDragStart(task.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => onTaskClick(task)}
                    className={`p-3 border rounded-lg bg-background hover:shadow-md cursor-grab active:cursor-grabbing transition-all ${
                      isDragging ? 'opacity-50 scale-95 ring-2 ring-primary' : ''
                    }`}
                  >
                    <p className="font-medium text-sm mb-1">{task.title}</p>
                    {task.projectId && task.projectId !== 'unassigned' && (
                      <Badge variant="secondary" className="text-xs mb-1">
                        {getProjectById(task.projectId)?.name || task.projectId}
                      </Badge>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: TASK_PRIORITY_COLORS[task.priority] + '20',
                          borderColor: TASK_PRIORITY_COLORS[task.priority],
                          color: TASK_PRIORITY_COLORS[task.priority],
                        }}
                      >
                        {task.priority}
                      </Badge>
                      {task.assignees.length > 0 && (
                        <div className="flex -space-x-1">
                          {task.assignees.slice(0, 3).map((assigneeId, idx) => {
                            const member = getMemberById(assigneeId);
                            return (
                              <div
                                key={idx}
                                className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium border-2 border-background"
                                title={member?.name}
                              >
                                {member?.name?.charAt(0) || '?'}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {statusTasks.length === 0 && isDragOver && (
                <div className="p-4 text-center text-sm text-muted-foreground border-2 border-dashed border-primary/30 rounded-lg">
                  {t('projects.tasks.noTasks')}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
