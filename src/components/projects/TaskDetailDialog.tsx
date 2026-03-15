/**
 * Task Detail/Create Dialog Component
 * Parent shell with tabs that renders TaskFormPanel and TaskMessagesPanel
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle2,
  Trash2,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, MessageType } from '@/types/project';
import type { Member, Message, Project, Category } from './task-detail/types';
import { TaskFormPanel } from './task-detail/TaskFormPanel';
import type { TaskFormData } from './task-detail/TaskFormPanel';
import { TaskMessagesPanel } from './task-detail/TaskMessagesPanel';
import { toDate } from './task-detail/messageUtils';

interface TaskDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTask: Task | null;
  tasks: Task[];
  messages: Message[];
  members: Member[];
  projects: Project[];
  categories: Category[];
  currentProjectId: string | null;
  isTasksLoading: boolean;
  isMessagesLoading: boolean;
  error: string | null;
  getMemberById: (id: string) => Member | undefined;
  onSaveTask: (data: {
    isEdit: boolean;
    taskId?: string;
    formData: {
      title: string;
      description: string;
      status: TaskStatus;
      priority: TaskPriority;
      projectId: string;
      categoryId: string;
      startDate: string;
      dueDate: string;
      assignees: string[];
    };
  }) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onSendMessage: (data: { taskId: string; content: string; type: MessageType; mentions?: string[] }) => Promise<void>;
  onMarkMessageAsRead: (messageId: string) => void;
  onResolveMessage: (messageId: string) => Promise<void>;
  onFetchMessages: (taskId: string) => void;
  onCreateCategory: (name: string, color: string, type: 'event' | 'task') => Promise<{ id: string }>;
}

export function TaskDetailDialog({
  isOpen,
  onOpenChange,
  selectedTask,
  messages,
  members,
  projects,
  categories,
  currentProjectId,
  isTasksLoading,
  isMessagesLoading,
  error,
  getMemberById,
  onSaveTask,
  onDeleteTask,
  onSendMessage,
  onMarkMessageAsRead,
  onResolveMessage,
  onFetchMessages,
  onCreateCategory,
}: TaskDetailDialogProps) {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'details' | 'messages'>('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    projectId: '',
    categoryId: '',
    startDate: '',
    dueDate: '',
    assignees: [],
  });

  // Initialize form when dialog opens or selectedTask changes
  const initializeForm = useCallback((task: Task | null) => {
    if (task) {
      const startDate = toDate(task.startDate);
      const dueDate = toDate(task.dueDate);
      setTaskFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        projectId: task.projectId === 'unassigned' ? '' : (task.projectId || ''),
        categoryId: (task as Task & { categoryId?: string }).categoryId || '',
        startDate: startDate ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}` : '',
        dueDate: dueDate ? `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}` : '',
        assignees: task.assignees || [],
      });
    } else {
      setTaskFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        projectId: currentProjectId || '',
        categoryId: '',
        startDate: '',
        dueDate: '',
        assignees: [],
      });
    }
    setActiveTab('details');
  }, [currentProjectId]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setActiveTab('details');
    }
    onOpenChange(open);
  }, [onOpenChange]);

  const handleSaveTask = useCallback(async () => {
    if (!taskFormData.title.trim()) return;
    await onSaveTask({
      isEdit: !!selectedTask,
      taskId: selectedTask?.id,
      formData: taskFormData,
    });
  }, [selectedTask, taskFormData, onSaveTask]);

  const handleDeleteTask = useCallback(() => {
    if (selectedTask) {
      setShowDeleteConfirm(true);
    }
  }, [selectedTask]);

  const handleConfirmDeleteTask = useCallback(async () => {
    if (selectedTask) {
      await onDeleteTask(selectedTask.id);
      setShowDeleteConfirm(false);
    }
  }, [selectedTask, onDeleteTask]);

  const handleTabChange = useCallback((tab: 'details' | 'messages') => {
    setActiveTab(tab);
    if (tab === 'messages' && selectedTask) {
      onFetchMessages(selectedTask.id);
    }
  }, [selectedTask, onFetchMessages]);

  // Initialize form when dialog opens
  const prevIsOpenRef = useRef(false);
  const prevSelectedTaskRef = useRef<string | null>(null);
  if (isOpen && !prevIsOpenRef.current) {
    initializeForm(selectedTask);
  }
  prevIsOpenRef.current = isOpen;
  if (selectedTask?.id !== prevSelectedTaskRef.current && isOpen) {
    prevSelectedTaskRef.current = selectedTask?.id || null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {selectedTask ? t('projects.tasks.editTask') : t('projects.tasks.newTask')}
          </DialogTitle>
          <DialogDescription>
            {selectedTask ? t('projects.tasks.editTask') : t('projects.tasks.newTask')}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switching (existing task only) */}
        {selectedTask && (
          <div className="flex border-b">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('details')}
            >
              <CheckCircle2 className="h-4 w-4 inline mr-2" />
              {t('common.detail')}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'messages'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('messages')}
            >
              <MessageSquare className="h-4 w-4" />
              {t('projects.tasks.comments')}
              {messages.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {messages.length}
                </Badge>
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <TaskFormPanel
            taskFormData={taskFormData}
            setTaskFormData={setTaskFormData}
            members={members}
            projects={projects}
            categories={categories}
            getMemberById={getMemberById}
            onCreateCategory={onCreateCategory}
          />
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && selectedTask && (
          <TaskMessagesPanel
            messages={messages}
            members={members}
            isMessagesLoading={isMessagesLoading}
            getMemberById={getMemberById}
            onSendMessage={onSendMessage}
            onMarkMessageAsRead={onMarkMessageAsRead}
            onResolveMessage={onResolveMessage}
            taskId={selectedTask.id}
          />
        )}

        {/* Footer (details tab only) */}
        {activeTab === 'details' && (
          <DialogFooter className="flex justify-between">
            {selectedTask && (
              <Button variant="destructive" onClick={handleDeleteTask}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveTask} disabled={!taskFormData.title || isTasksLoading}>
                {isTasksLoading ? t('common.saving') : selectedTask ? t('common.edit') : t('common.add')}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('projects.tasks.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
