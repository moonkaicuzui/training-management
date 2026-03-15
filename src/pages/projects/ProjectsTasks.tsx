/**
 * 과제 관리 페이지
 *
 * Asana 스타일의 다중 뷰 (List, Board, Timeline, Calendar)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  Plus,
  List,
  Kanban,
  Calendar,
  GanttChart,
  AlertTriangle,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useProjectStore } from '@/stores/projectStore';
import type { ViewType, TaskStatus, Task, CreateTaskInput, UpdateTaskInput } from '@/types/project';

import { TaskListView } from '@/components/projects/TaskListView';
import { TaskBoardView } from '@/components/projects/TaskBoardView';
import { TaskTimelineView } from '@/components/projects/TaskTimelineView';
import { TaskDetailDialog } from '@/components/projects/TaskDetailDialog';

export default function ProjectsTasks() {
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
    tasks,
    messages,
    currentView,
    setCurrentView,
    getMemberById,
    getProjectById,
    isTasksLoading,
    isMessagesLoading,
    error,
    updateTask,
    createTask,
    deleteTask,
    fetchAllTasks,
    fetchTasksByProject,
    fetchMessagesByTask,
    createMessage,
    markMessageAsRead,
    resolveMessage,
    members,
    projects,
    categories,
    fetchProjects,
    fetchCategories,
    createCategory,
    currentProjectId,
    createNotification,
  } = useProjectStore(useShallow((state) => ({ tasks: state.tasks, messages: state.messages, currentView: state.currentView, setCurrentView: state.setCurrentView, getMemberById: state.getMemberById, getProjectById: state.getProjectById, isTasksLoading: state.isTasksLoading, isMessagesLoading: state.isMessagesLoading, error: state.error, updateTask: state.updateTask, createTask: state.createTask, deleteTask: state.deleteTask, fetchAllTasks: state.fetchAllTasks, fetchTasksByProject: state.fetchTasksByProject, fetchMessagesByTask: state.fetchMessagesByTask, createMessage: state.createMessage, markMessageAsRead: state.markMessageAsRead, resolveMessage: state.resolveMessage, members: state.members, projects: state.projects, categories: state.categories, fetchProjects: state.fetchProjects, fetchCategories: state.fetchCategories, createCategory: state.createCategory, currentProjectId: state.currentProjectId, createNotification: state.createNotification })));

  const initializedRef = useRef(false);
  const [timelineDate, setTimelineDate] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Drag & Drop handlers
  const handleDragStart = useCallback((taskId: string) => {
    setDraggedTaskId(taskId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDragOverStatus(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverStatus(status);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId) {
      const task = tasks.find(t => t.id === draggedTaskId);
      if (task && task.status !== newStatus) {
        await updateTask(draggedTaskId, { status: newStatus });
      }
    }
    setDraggedTaskId(null);
    setDragOverStatus(null);
  }, [draggedTaskId, tasks, updateTask]);

  // Task click -> open detail dialog
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  }, []);

  // New task -> open dialog
  const handleNewTask = useCallback(() => {
    setSelectedTask(null);
    setIsDialogOpen(true);
  }, []);

  // Save task (create or update)
  const handleSaveTask = useCallback(async (data: {
    isEdit: boolean;
    taskId?: string;
    formData: {
      title: string;
      description: string;
      status: TaskStatus;
      priority: string;
      projectId: string;
      categoryId: string;
      startDate: string;
      dueDate: string;
      assignees: string[];
    };
  }) => {
    const { isEdit, taskId, formData } = data;
    const projectId = formData.projectId || 'unassigned';
    const categoryId = formData.categoryId || undefined;

    try {
      if (isEdit && taskId) {
        const existingTask = tasks.find(t => t.id === taskId);
        const newAssignees = formData.assignees.filter(
          (a) => !existingTask?.assignees.includes(a)
        );
        await updateTask(taskId, {
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status,
          priority: formData.priority,
          projectId,
          categoryId,
          assignees: formData.assignees,
          startDate: formData.startDate ? new Date(formData.startDate) : undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        } as UpdateTaskInput & { categoryId?: string });
        for (const assigneeId of newAssignees) {
          const member = getMemberById(assigneeId);
          createNotification({
            userId: assigneeId,
            type: 'task_assigned',
            title: t('projects.notifications.taskAssigned', {
              memberName: member?.name || assigneeId,
              taskTitle: formData.title,
            }),
            message: formData.title,
            taskId,
            projectId,
            isRead: false,
          });
        }
      } else {
        const task = await createTask({
          projectId,
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          categoryId,
          assignees: formData.assignees,
          startDate: formData.startDate ? new Date(formData.startDate) : undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        } as CreateTaskInput & { categoryId?: string });
        for (const assigneeId of formData.assignees) {
          const member = getMemberById(assigneeId);
          createNotification({
            userId: assigneeId,
            type: 'task_assigned',
            title: t('projects.notifications.taskAssigned', {
              memberName: member?.name || assigneeId,
              taskTitle: formData.title,
            }),
            message: formData.title,
            taskId: task.id,
            projectId,
            isRead: false,
          });
        }
      }
      setIsDialogOpen(false);
      setSelectedTask(null);
    } catch {
      // Error handled by store, keep dialog open
    }
  }, [tasks, updateTask, createTask, getMemberById, createNotification, t]);

  // Delete task
  const handleDeleteTask = useCallback(async (taskId: string) => {
    await deleteTask(taskId);
    setIsDialogOpen(false);
    setSelectedTask(null);
  }, [deleteTask]);

  // Send message
  const handleSendMessage = useCallback(async (data: { taskId: string; content: string; type: string; mentions?: string[] }) => {
    await createMessage({
      taskId: data.taskId,
      content: data.content,
      type: data.type as 'comment' | 'question' | 'request' | 'info' | 'approval' | 'rejection',
      mentions: data.mentions,
    });
  }, [createMessage]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      Promise.all([
        currentProjectId ? fetchTasksByProject(currentProjectId) : fetchAllTasks(),
        fetchProjects(),
        fetchCategories(),
      ]);
    }
  }, [fetchAllTasks, fetchTasksByProject, fetchProjects, fetchCategories, currentProjectId]);

  // View icons & labels
  const viewIcons: Record<ViewType, React.ReactNode> = {
    list: <List className="h-4 w-4" />,
    board: <Kanban className="h-4 w-4" />,
    timeline: <GanttChart className="h-4 w-4" />,
    calendar: <Calendar className="h-4 w-4" />,
  };

  const viewLabels: Record<ViewType, string> = {
    list: t('projects.views.list'),
    board: t('projects.views.board'),
    timeline: t('projects.views.timeline'),
    calendar: t('projects.views.calendar'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6" />
            {t('projects.tasks.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('projects.tasks.description')}
          </p>
        </div>
        <Button onClick={handleNewTask}>
          <Plus className="h-4 w-4 mr-2" />
          {t('projects.tasks.newTask')}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* View tabs */}
      <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as ViewType)}>
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          {(['list', 'board', 'timeline', 'calendar'] as ViewType[]).map((view) => (
            <TabsTrigger key={view} value={view} className="flex items-center gap-2">
              {viewIcons[view]}
              <span className="hidden sm:inline">{viewLabels[view]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Current view content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {viewIcons[currentView]}
            {viewLabels[currentView]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isTasksLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{t('projects.tasks.noTasks')}</p>
              <Button onClick={handleNewTask}>
                <Plus className="h-4 w-4 mr-2" />
                {t('projects.tasks.newTask')}
              </Button>
            </div>
          ) : (
            <>
              {currentView === 'list' && (
                <TaskListView
                  tasks={tasks}
                  statusLabels={STATUS_LABELS}
                  getProjectById={getProjectById}
                  onTaskClick={handleTaskClick}
                />
              )}

              {currentView === 'board' && (
                <TaskBoardView
                  tasks={tasks}
                  statusLabels={STATUS_LABELS}
                  getProjectById={getProjectById}
                  getMemberById={getMemberById}
                  draggedTaskId={draggedTaskId}
                  dragOverStatus={dragOverStatus}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setDragOverStatus(null)}
                  onDrop={handleDrop}
                  onTaskClick={handleTaskClick}
                />
              )}

              {currentView === 'timeline' && (
                <TaskTimelineView
                  tasks={tasks}
                  statusLabels={STATUS_LABELS}
                  timelineDate={timelineDate}
                  onTimelineDateChange={setTimelineDate}
                  onTaskClick={handleTaskClick}
                />
              )}

              {currentView === 'calendar' && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {t('projects.calendar.description')}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/projects/calendar')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('projects.calendar.title')}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Task detail/create dialog */}
      <TaskDetailDialog
        isOpen={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedTask(null);
        }}
        selectedTask={selectedTask}
        tasks={tasks}
        messages={messages}
        members={members}
        projects={projects}
        categories={categories}
        currentProjectId={currentProjectId}
        isTasksLoading={isTasksLoading}
        isMessagesLoading={isMessagesLoading}
        error={error}
        getMemberById={getMemberById}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        onSendMessage={handleSendMessage}
        onMarkMessageAsRead={markMessageAsRead}
        onResolveMessage={resolveMessage}
        onFetchMessages={fetchMessagesByTask}
        onCreateCategory={createCategory}
      />
    </div>
  );
}
