/**
 * Task Timeline View (Gantt Chart) Component
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, differenceInDays, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TASK_STATUS_COLORS } from '@/types/project';
import type { Task, TaskStatus } from '@/types/project';

// Date conversion helper
const toDate = (value: Date | { toDate: () => Date } | string | number | undefined): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value) return value.toDate();
  return new Date(value);
};

interface TaskTimelineViewProps {
  tasks: Task[];
  statusLabels: Record<TaskStatus, string>;
  timelineDate: Date;
  onTimelineDateChange: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}

const ALL_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'delayed_start', 'delayed_complete', 'review', 'done'];

export function TaskTimelineView({
  tasks,
  statusLabels,
  timelineDate,
  onTimelineDateChange,
  onTaskClick,
}: TaskTimelineViewProps) {
  const { t } = useTranslation();

  const timelineRange = useMemo(() => {
    const start = startOfMonth(timelineDate);
    const end = endOfMonth(timelineDate);
    const days = eachDayOfInterval({ start, end });
    return { start, end, days };
  }, [timelineDate]);

  const getTaskBarStyle = useCallback((task: Task) => {
    const startDate = toDate(task.startDate);
    const dueDate = toDate(task.dueDate);

    if (!startDate && !dueDate) return null;

    const taskStart = startDate || dueDate!;
    const taskEnd = dueDate || startDate!;

    const rangeStart = timelineRange.start;
    const rangeEnd = timelineRange.end;
    const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;

    if (taskEnd < rangeStart || taskStart > rangeEnd) return null;

    const effectiveStart = taskStart < rangeStart ? rangeStart : taskStart;
    const effectiveEnd = taskEnd > rangeEnd ? rangeEnd : taskEnd;

    const leftOffset = differenceInDays(effectiveStart, rangeStart);
    const duration = differenceInDays(effectiveEnd, effectiveStart) + 1;

    const leftPercent = (leftOffset / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 3)}%`,
    };
  }, [timelineRange]);

  return (
    <div className="space-y-4">
      {/* Timeline header - month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onTimelineDateChange(subMonths(timelineDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[120px] text-center">
            {format(timelineDate, 'yyyy년 M월', { locale: ko })}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onTimelineDateChange(addMonths(timelineDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTimelineDateChange(new Date())}
          >
            {t('projects.calendar.today')}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {ALL_STATUSES.map((status) => (
            <div key={status} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: TASK_STATUS_COLORS[status] }}
              />
              <span className="text-muted-foreground">{statusLabels[status]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Date header */}
        <div className="flex border-b bg-muted/50">
          <div className="w-48 min-w-48 p-2 border-r font-medium text-sm">
            {t('projects.tasks.taskTitle')}
          </div>
          <div className="flex-1 flex">
            {timelineRange.days.map((day, idx) => (
              <div
                key={idx}
                className={`flex-1 min-w-[24px] p-1 text-center text-xs border-r last:border-r-0 ${
                  isToday(day)
                    ? 'bg-primary/10 font-bold text-primary'
                    : day.getDay() === 0 || day.getDay() === 6
                    ? 'bg-muted/30 text-muted-foreground'
                    : ''
                }`}
              >
                <div>{format(day, 'd')}</div>
                <div className="text-[10px] text-muted-foreground">
                  {format(day, 'EEE', { locale: ko })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task rows */}
        <div className="max-h-[400px] overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('projects.tasks.noTasks')}
            </div>
          ) : (
            tasks.map((task) => {
              const barStyle = getTaskBarStyle(task);
              return (
                <div
                  key={task.id}
                  className="flex border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-48 min-w-48 p-2 border-r flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: TASK_STATUS_COLORS[task.status] }}
                    />
                    <span className="text-sm truncate" title={task.title}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex-1 relative h-10">
                    <div className="absolute inset-0 flex">
                      {timelineRange.days.map((day, idx) => (
                        <div
                          key={idx}
                          className={`flex-1 min-w-[24px] border-r last:border-r-0 ${
                            isToday(day) ? 'bg-primary/5' : ''
                          } ${
                            day.getDay() === 0 || day.getDay() === 6
                              ? 'bg-muted/20'
                              : ''
                          }`}
                        />
                      ))}
                    </div>
                    {barStyle && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-6 rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center px-1"
                        style={{
                          ...barStyle,
                          backgroundColor: TASK_STATUS_COLORS[task.status],
                        }}
                        title={`${task.title}\n${t('projects.tasks.startDate')}: ${toDate(task.startDate)?.toLocaleDateString() || '-'}\n${t('projects.tasks.dueDate')}: ${toDate(task.dueDate)?.toLocaleDateString() || '-'}`}
                        onClick={() => onTaskClick(task)}
                      >
                        <span className="text-xs text-white truncate">
                          {task.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Today marker legend */}
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <div className="w-3 h-3 bg-primary/10 border border-primary/30 rounded" />
        {t('projects.calendar.today')}
      </div>
    </div>
  );
}
