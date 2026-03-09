/**
 * Task Detail/Create Dialog Component
 * Contains the task form (details tab) and communication tab (messages)
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CheckCircle2,
  Plus,
  Trash2,
  User,
  MessageSquare,
  Send,
  CheckCheck,
  AtSign,
  HelpCircle,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Info,
  AlertTriangle,
  X,
  UserPlus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS, CATEGORY_COLORS } from '@/types/project';
import type { Task, TaskStatus, TaskPriority, MessageType } from '@/types/project';

// Message type icon
const MessageTypeIcon: React.FC<{ type: MessageType; className?: string }> = ({ type, className = 'h-4 w-4' }) => {
  switch (type) {
    case 'question': return <HelpCircle className={className} />;
    case 'request': return <FileText className={className} />;
    case 'approval': return <ThumbsUp className={className} />;
    case 'rejection': return <ThumbsDown className={className} />;
    case 'info': return <Info className={className} />;
    case 'comment':
    default: return <MessageSquare className={className} />;
  }
};

const MESSAGE_TYPE_COLORS: Record<MessageType, string> = {
  question: '#F59E0B',
  request: '#3B82F6',
  approval: '#10B981',
  rejection: '#EF4444',
  info: '#6366F1',
  comment: '#6B7280',
};

// Types for members and messages from store
interface Member {
  id: string;
  name: string;
  email: string;
  department?: string;
  photoURL?: string;
  status: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  type: MessageType;
  createdAt: Date | { toDate: () => Date };
  mentions?: string[];
  readBy: Record<string, unknown>;
  isResolved?: boolean;
}

interface Project {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  type: string;
  isActive: boolean;
}

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

// Date conversion helper
const toDate = (value: Date | { toDate: () => Date } | string | number | undefined): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value) return value.toDate();
  return new Date(value);
};

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

  const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
    question: t('projects.messageType.question'),
    request: t('projects.messageType.request'),
    approval: t('projects.messageType.approval'),
    rejection: t('projects.messageType.rejection'),
    info: t('projects.messageType.info'),
    comment: t('projects.messageType.comment'),
  };

  const [activeTab, setActiveTab] = useState<'details' | 'messages'>('details');
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    projectId: '',
    categoryId: '',
    startDate: '',
    dueDate: '',
    assignees: [] as string[],
  });
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [isTaskCategoryPopoverOpen, setIsTaskCategoryPopoverOpen] = useState(false);
  const [isNewTaskCategoryMode, setIsNewTaskCategoryMode] = useState(false);
  const [newTaskCategoryName, setNewTaskCategoryName] = useState('');
  const [newTaskCategoryColor, setNewTaskCategoryColor] = useState(CATEGORY_COLORS[10]);

  // Message state
  const [newMessageContent, setNewMessageContent] = useState('');
  const [newMessageType, setNewMessageType] = useState<MessageType>('comment');
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const taskCategories = useMemo(() => {
    return categories.filter(c => c.type === 'task' && c.isActive);
  }, [categories]);

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
    setAssigneeSearch('');
    setActiveTab('details');
    setNewMessageContent('');
    setSelectedMentions([]);
  }, [currentProjectId]);

  // Call initializeForm when the dialog opens
  // This is managed by the parent component via props

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setActiveTab('details');
      setNewMessageContent('');
      setSelectedMentions([]);
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

  const handleDeleteTask = useCallback(async () => {
    if (selectedTask && confirm(t('projects.tasks.deleteConfirm'))) {
      await onDeleteTask(selectedTask.id);
    }
  }, [selectedTask, onDeleteTask, t]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessageContent.trim() || !selectedTask) return;
    await onSendMessage({
      taskId: selectedTask.id,
      content: newMessageContent,
      type: newMessageType,
      mentions: selectedMentions.length > 0 ? selectedMentions : undefined,
    });
    setNewMessageContent('');
    setNewMessageType('comment');
    setSelectedMentions([]);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [newMessageContent, newMessageType, selectedTask, selectedMentions, onSendMessage]);

  const handleMentionSelect = useCallback((memberId: string) => {
    if (!selectedMentions.includes(memberId)) {
      setSelectedMentions([...selectedMentions, memberId]);
    }
    setShowMentionPopup(false);
    setMentionSearch('');
    messageInputRef.current?.focus();
  }, [selectedMentions]);

  const handleRemoveMention = useCallback((memberId: string) => {
    setSelectedMentions(selectedMentions.filter(id => id !== memberId));
  }, [selectedMentions]);

  const handleMessageInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessageContent(value);
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentionPopup(true);
      setMentionSearch('');
    } else if (lastAtIndex !== -1) {
      const searchText = value.substring(lastAtIndex + 1);
      if (!searchText.includes(' ')) {
        setMentionSearch(searchText);
        setShowMentionPopup(true);
      } else {
        setShowMentionPopup(false);
      }
    } else {
      setShowMentionPopup(false);
    }
  }, []);

  const filteredMentionMembers = useMemo(() => {
    if (!mentionSearch) return members.filter(m => m.status === 'active');
    return members.filter(
      m => m.status === 'active' &&
           (m.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
            m.email.toLowerCase().includes(mentionSearch.toLowerCase()))
    );
  }, [members, mentionSearch]);

  const formatMessageTime = useCallback((date: Date | { toDate: () => Date }) => {
    const d = date instanceof Date ? date : date.toDate();
    return formatDistanceToNow(d, { addSuffix: true, locale: ko });
  }, []);

  // Fetch messages when switching to messages tab
  const handleTabChange = useCallback((tab: 'details' | 'messages') => {
    setActiveTab(tab);
    if (tab === 'messages' && selectedTask) {
      onFetchMessages(selectedTask.id);
    }
  }, [selectedTask, onFetchMessages]);

  // Expose initializeForm for parent
  // Using a ref pattern or effect would be cleaner, but for simplicity
  // the parent should call this method before opening the dialog
  // We'll use an effect to detect when selectedTask changes
  const prevSelectedTaskRef = useRef<string | null>(null);
  const prevIsOpenRef = useRef(false);
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
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && selectedTask && (
          <div className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 py-4">
                {isMessagesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">{t('projects.tasks.message')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('projects.tasks.message')}</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const sender = getMemberById(message.senderId);
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.isResolved ? 'opacity-60' : ''}`}
                        onMouseEnter={() => onMarkMessageAsRead(message.id)}
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={sender?.photoURL} />
                          <AvatarFallback className="text-xs">{sender?.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{sender?.name || t('common.noData')}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge
                                    variant="outline"
                                    className="h-5 px-1.5 text-xs"
                                    style={{ borderColor: MESSAGE_TYPE_COLORS[message.type], color: MESSAGE_TYPE_COLORS[message.type] }}
                                  >
                                    <MessageTypeIcon type={message.type} className="h-3 w-3 mr-1" />
                                    {MESSAGE_TYPE_LABELS[message.type]}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>{MESSAGE_TYPE_LABELS[message.type]}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="text-xs text-muted-foreground">{formatMessageTime(message.createdAt)}</span>
                            {message.isResolved && (
                              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                <CheckCheck className="h-3 w-3 mr-1" />
                                {t('projects.status.completed')}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 text-sm whitespace-pre-wrap break-words">{message.content}</div>
                          {message.mentions && message.mentions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {message.mentions.map((mentionId) => {
                                const mentionedMember = getMemberById(mentionId);
                                return (
                                  <Badge key={mentionId} variant="secondary" className="h-5 px-1.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                    <AtSign className="h-3 w-3 mr-0.5" />
                                    {mentionedMember?.name || mentionId}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                          {Object.keys(message.readBy).length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <CheckCheck className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{Object.keys(message.readBy).length}</span>
                            </div>
                          )}
                          {!message.isResolved && (message.type === 'question' || message.type === 'request') && (
                            <Button variant="ghost" size="sm" className="h-6 mt-2 text-xs" onClick={() => onResolveMessage(message.id)}>
                              <CheckCheck className="h-3 w-3 mr-1" />
                              {t('projects.status.completed')}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <Separator className="my-2" />

            {/* Message input area */}
            <div className="space-y-3">
              {selectedMentions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedMentions.map((mentionId) => {
                    const member = getMemberById(mentionId);
                    return (
                      <Badge key={mentionId} variant="secondary" className="h-6 px-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        <AtSign className="h-3 w-3 mr-0.5" />
                        {member?.name || mentionId}
                        <button className="ml-1 hover:text-red-500" onClick={() => handleRemoveMention(mentionId)}>x</button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Label className="text-xs">{t('projects.tasks.message')}:</Label>
                <div className="flex gap-1">
                  {(['comment', 'question', 'request', 'info', 'approval', 'rejection'] as MessageType[]).map((type) => (
                    <TooltipProvider key={type}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={newMessageType === type ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 w-7 p-0"
                            style={newMessageType === type ? { backgroundColor: MESSAGE_TYPE_COLORS[type] } : {}}
                            onClick={() => setNewMessageType(type)}
                          >
                            <MessageTypeIcon type={type} className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{MESSAGE_TYPE_LABELS[type]}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Textarea
                  ref={messageInputRef}
                  value={newMessageContent}
                  onChange={handleMessageInputChange}
                  placeholder={t('projects.tasks.message')}
                  rows={2}
                  className="pr-12 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                  }}
                />
                <Button
                  size="sm"
                  className="absolute bottom-2 right-2 h-8 w-8 p-0"
                  onClick={handleSendMessage}
                  disabled={!newMessageContent.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
                {showMentionPopup && filteredMentionMembers.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto bg-background border rounded-lg shadow-lg z-50">
                    {filteredMentionMembers.slice(0, 5).map((member) => (
                      <button
                        key={member.id}
                        className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left"
                        onClick={() => handleMentionSelect(member.id)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.photoURL} />
                          <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.department}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Enter / Shift+Enter</p>
            </div>
          </div>
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
    </Dialog>
  );
}
