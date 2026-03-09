/**
 * TaskFormPanel - The task details form (title, description, status, priority,
 * assignees, dates, project, category)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plus,
  User,
  X,
  UserPlus,
} from 'lucide-react';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS, CATEGORY_COLORS } from '@/types/project';
import type { TaskStatus, TaskPriority } from '@/types/project';
import type { Member, Project, Category } from './types';

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  categoryId: string;
  startDate: string;
  dueDate: string;
  assignees: string[];
}

interface TaskFormPanelProps {
  taskFormData: TaskFormData;
  setTaskFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
  members: Member[];
  projects: Project[];
  categories: Category[];
  getMemberById: (id: string) => Member | undefined;
  onCreateCategory: (name: string, color: string, type: 'event' | 'task') => Promise<{ id: string }>;
}

export function TaskFormPanel({
  taskFormData,
  setTaskFormData,
  members,
  projects,
  categories,
  getMemberById,
  onCreateCategory,
}: TaskFormPanelProps) {
  const { t } = useTranslation();

  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [isTaskCategoryPopoverOpen, setIsTaskCategoryPopoverOpen] = useState(false);
  const [isNewTaskCategoryMode, setIsNewTaskCategoryMode] = useState(false);
  const [newTaskCategoryName, setNewTaskCategoryName] = useState('');
  const [newTaskCategoryColor, setNewTaskCategoryColor] = useState(CATEGORY_COLORS[10]);

  const PRIORITY_LABELS: Record<TaskPriority, string> = {
    urgent: t('projects.priority.urgent'),
    high: t('projects.priority.high'),
    medium: t('projects.priority.medium'),
    low: t('projects.priority.low'),
  };

  const STATUS_LABELS: Record<TaskStatus, string> = {
    todo: t('projects.status.planned'),
    in_progress: t('projects.status.inProgress'),
    delayed_start: t('projects.status.delayedStart'),
    delayed_complete: t('projects.status.delayedCompletion'),
    review: t('projects.status.underReview'),
    done: t('projects.status.completed'),
  };

  const taskCategories = categories.filter(c => c.type === 'task' && c.isActive);

  return (
    <div className="grid gap-4 py-4 overflow-y-auto">
      {/* Title */}
      <div className="grid gap-2">
        <Label htmlFor="task-title">{t('projects.tasks.taskTitle')} *</Label>
        <Input
          id="task-title"
          value={taskFormData.title}
          onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
          placeholder={t('projects.tasks.taskTitle')}
        />
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor="task-description">{t('projects.tasks.taskDescription')}</Label>
        <Textarea
          id="task-description"
          value={taskFormData.description}
          onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
          placeholder={t('projects.tasks.taskDescription')}
          rows={3}
        />
      </div>

      {/* Project */}
      <div className="grid gap-2">
        <Label>{t('projects.tasks.project')} ({t('common.optional')})</Label>
        <Select
          value={taskFormData.projectId || '_unassigned'}
          onValueChange={(value) => setTaskFormData({ ...taskFormData, projectId: value === '_unassigned' ? '' : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('projects.tasks.unassigned')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_unassigned">{t('projects.tasks.unassigned')}</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignees */}
      <div className="grid gap-2">
        <Label className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {t('projects.tasks.assignee')}
        </Label>
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {taskFormData.assignees.map((assigneeId) => {
            const member = getMemberById(assigneeId);
            return (
              <Badge key={assigneeId} variant="secondary" className="gap-1 pr-1">
                {member?.name || assigneeId}
                <button
                  type="button"
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  onClick={() => setTaskFormData({
                    ...taskFormData,
                    assignees: taskFormData.assignees.filter((id) => id !== assigneeId),
                  })}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-fit gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              {t('projects.tasks.selectAssignees')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <Input
              placeholder={t('projects.tasks.searchMembers')}
              value={assigneeSearch}
              onChange={(e) => setAssigneeSearch(e.target.value)}
              className="mb-2 h-8 text-sm"
            />
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {members
                .filter((m) => m.status === 'active')
                .filter((m) =>
                  !assigneeSearch ||
                  m.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                  m.email.toLowerCase().includes(assigneeSearch.toLowerCase())
                )
                .map((member) => {
                  const isSelected = taskFormData.assignees.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTaskFormData({
                              ...taskFormData,
                              assignees: [...taskFormData.assignees, member.id],
                            });
                          } else {
                            setTaskFormData({
                              ...taskFormData,
                              assignees: taskFormData.assignees.filter((id) => id !== member.id),
                            });
                          }
                        }}
                      />
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={member.photoURL} />
                        <AvatarFallback className="text-[10px]">{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{member.name}</span>
                    </label>
                  );
                })}
            </div>
          </PopoverContent>
        </Popover>
        {taskFormData.assignees.length === 0 && (
          <p className="text-xs text-muted-foreground">{t('projects.tasks.noAssignee')}</p>
        )}
      </div>

      {/* Category */}
      <div className="grid gap-2">
        <Label>{t('projects.tasks.category')} ({t('common.optional')})</Label>
        <Popover open={isTaskCategoryPopoverOpen} onOpenChange={(open) => {
          setIsTaskCategoryPopoverOpen(open);
          if (!open) setIsNewTaskCategoryMode(false);
        }}>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button" className="justify-start font-normal">
              {taskFormData.categoryId ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: taskCategories.find(c => c.id === taskFormData.categoryId)?.color }}
                  />
                  {taskCategories.find(c => c.id === taskFormData.categoryId)?.name}
                </div>
              ) : (
                <span className="text-muted-foreground">{t('projects.tasks.unassigned')}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            {!isNewTaskCategoryMode ? (
              <div className="py-1">
                <button
                  type="button"
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${!taskFormData.categoryId ? 'bg-accent' : ''}`}
                  onClick={() => { setTaskFormData({ ...taskFormData, categoryId: '' }); setIsTaskCategoryPopoverOpen(false); }}
                >
                  {t('projects.tasks.unassigned')}
                </button>
                {taskCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${taskFormData.categoryId === category.id ? 'bg-accent' : ''}`}
                    onClick={() => { setTaskFormData({ ...taskFormData, categoryId: category.id }); setIsTaskCategoryPopoverOpen(false); }}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </button>
                ))}
                <div className="border-t my-1" />
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-primary transition-colors"
                  onClick={() => { setIsNewTaskCategoryMode(true); setNewTaskCategoryName(''); setNewTaskCategoryColor(CATEGORY_COLORS[10]); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('projects.calendar.newCategory')}
                </button>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('projects.calendar.categoryName')}</Label>
                  <Input
                    value={newTaskCategoryName}
                    onChange={(e) => setNewTaskCategoryName(e.target.value)}
                    placeholder={t('projects.calendar.categoryName')}
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('projects.calendar.selectColor')}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 transition-all ${newTaskCategoryColor === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTaskCategoryColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsNewTaskCategoryMode(false)}>
                    {t('projects.calendar.cancel')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!newTaskCategoryName.trim()}
                    onClick={async () => {
                      const created = await onCreateCategory(newTaskCategoryName.trim(), newTaskCategoryColor, 'task');
                      setTaskFormData({ ...taskFormData, categoryId: created.id });
                      setIsNewTaskCategoryMode(false);
                      setIsTaskCategoryPopoverOpen(false);
                    }}
                  >
                    {t('projects.calendar.addCategory')}
                  </Button>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Status & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t('projects.tasks.status')}</Label>
          <Select
            value={taskFormData.status}
            onValueChange={(value) => setTaskFormData({ ...taskFormData, status: value as TaskStatus })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('projects.tasks.status')} />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TASK_STATUS_COLORS[status] }} />
                    {STATUS_LABELS[status]}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t('projects.tasks.priority')}</Label>
          <Select
            value={taskFormData.priority}
            onValueChange={(value) => setTaskFormData({ ...taskFormData, priority: value as TaskPriority })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('projects.tasks.priority')} />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TASK_PRIORITY_COLORS[priority] }} />
                    {PRIORITY_LABELS[priority]}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Start & Due Date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="task-start-date">{t('projects.tasks.startDate')}</Label>
          <Input
            id="task-start-date"
            type="date"
            value={taskFormData.startDate}
            onChange={(e) => setTaskFormData({ ...taskFormData, startDate: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-due-date">{t('projects.tasks.dueDate')}</Label>
          <Input
            id="task-due-date"
            type="date"
            value={taskFormData.dueDate}
            onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
