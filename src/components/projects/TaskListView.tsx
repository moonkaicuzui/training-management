/**
 * Task List View Component
 * Flat list of all tasks with status, priority, project badges
 */

import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/types/project';
import type { Task, TaskStatus } from '@/types/project';

interface TaskListViewProps {
  tasks: Task[];
  statusLabels: Record<TaskStatus, string>;
  getProjectById: (id: string) => { name: string } | undefined;
  onTaskClick: (task: Task) => void;
}

export function TaskListView({ tasks, statusLabels, getProjectById, onTaskClick }: TaskListViewProps) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => onTaskClick(task)}
          className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: TASK_STATUS_COLORS[task.status] }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{task.title}</p>
            {task.description && (
              <p className="text-sm text-muted-foreground truncate">
                {task.description}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            style={{
              borderColor: TASK_STATUS_COLORS[task.status],
              color: TASK_STATUS_COLORS[task.status],
            }}
          >
            {statusLabels[task.status]}
          </Badge>
          <Badge
            style={{
              backgroundColor: TASK_PRIORITY_COLORS[task.priority],
            }}
          >
            {task.priority}
          </Badge>
          {task.projectId && task.projectId !== 'unassigned' && (
            <Badge variant="secondary" className="text-xs">
              {getProjectById(task.projectId)?.name || task.projectId}
            </Badge>
          )}
          {task.dueDate && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {(task.dueDate instanceof Date
                ? task.dueDate
                : task.dueDate.toDate()
              ).toLocaleDateString()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
