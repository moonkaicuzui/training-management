/**
 * 과제 관리 페이지
 *
 * Asana 스타일의 다중 뷰 (List, Board, Timeline, Calendar)
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  CheckCircle2,
  Plus,
  List,
  Kanban,
  Calendar,
  GanttChart,
  Clock,
  ChevronLeft,
  ChevronRight,
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
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, differenceInDays, isToday, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useProjectStore } from '@/stores/projectStore';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/types/project';
import type { ViewType, TaskStatus, Task, TaskPriority, MessageType } from '@/types/project';

// 우선순위 라벨
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
};

// 상태별 라벨
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '예정',
  in_progress: '진행중',
  delayed_start: '시작지연',
  delayed_complete: '완료지연',
  review: '검토중',
  done: '완료',
};

// 메시지 타입 라벨 및 아이콘
const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  question: '질문',
  request: '요청',
  approval: '승인',
  rejection: '반려',
  info: '정보',
  comment: '댓글',
};

// 메시지 타입별 아이콘 컴포넌트
const MessageTypeIcon: React.FC<{ type: MessageType; className?: string }> = ({ type, className = 'h-4 w-4' }) => {
  switch (type) {
    case 'question':
      return <HelpCircle className={className} />;
    case 'request':
      return <FileText className={className} />;
    case 'approval':
      return <ThumbsUp className={className} />;
    case 'rejection':
      return <ThumbsDown className={className} />;
    case 'info':
      return <Info className={className} />;
    case 'comment':
    default:
      return <MessageSquare className={className} />;
  }
};

// 메시지 타입별 색상
const MESSAGE_TYPE_COLORS: Record<MessageType, string> = {
  question: '#F59E0B', // Amber
  request: '#3B82F6',  // Blue
  approval: '#10B981', // Green
  rejection: '#EF4444', // Red
  info: '#6366F1',     // Indigo
  comment: '#6B7280',  // Gray
};

// Date 변환 헬퍼
const toDate = (value: Date | { toDate: () => Date } | string | number | undefined): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value) return value.toDate();
  return new Date(value);
};

export default function ProjectsTasks() {
  const {
    tasks,
    messages,
    currentView,
    setCurrentView,
    getMemberById,
    isTasksLoading,
    isMessagesLoading,
    updateTask,
    createTask,
    deleteTask,
    fetchTasksByProject,
    fetchMessagesByTask,
    createMessage,
    markMessageAsRead,
    resolveMessage,
    members,
  } = useProjectStore();

  const initializedRef = useRef(false);
  const [timelineDate, setTimelineDate] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    startDate: '',
    dueDate: '',
  });

  // 메시지 관련 상태
  const [activeTab, setActiveTab] = useState<'details' | 'messages'>('details');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [newMessageType, setNewMessageType] = useState<MessageType>('comment');
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 드래그 앤 드롭 핸들러
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

  // 과제 상세 모달 열기
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    const startDate = toDate(task.startDate);
    const dueDate = toDate(task.dueDate);
    setTaskFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
      dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : '',
    });
    setIsDialogOpen(true);
  }, []);

  // 새 과제 추가 모달 열기
  const handleNewTask = useCallback(() => {
    setSelectedTask(null);
    setTaskFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      startDate: '',
      dueDate: '',
    });
    setIsDialogOpen(true);
  }, []);

  // 과제 저장
  const handleSaveTask = useCallback(async () => {
    if (!taskFormData.title.trim()) return;

    if (selectedTask) {
      await updateTask(selectedTask.id, {
        title: taskFormData.title,
        description: taskFormData.description || undefined,
        status: taskFormData.status,
        priority: taskFormData.priority,
        startDate: taskFormData.startDate ? new Date(taskFormData.startDate) : undefined,
        dueDate: taskFormData.dueDate ? new Date(taskFormData.dueDate) : undefined,
      });
    } else {
      await createTask({
        projectId: 'default',
        title: taskFormData.title,
        description: taskFormData.description || undefined,
        priority: taskFormData.priority,
        startDate: taskFormData.startDate ? new Date(taskFormData.startDate) : undefined,
        dueDate: taskFormData.dueDate ? new Date(taskFormData.dueDate) : undefined,
      });
    }
    setIsDialogOpen(false);
    setSelectedTask(null);
  }, [selectedTask, taskFormData, updateTask, createTask]);

  // 과제 삭제
  const handleDeleteTask = useCallback(async () => {
    if (selectedTask && confirm('이 과제를 삭제하시겠습니까?')) {
      await deleteTask(selectedTask.id);
      setIsDialogOpen(false);
      setSelectedTask(null);
    }
  }, [selectedTask, deleteTask]);

  // 메시지 전송
  const handleSendMessage = useCallback(async () => {
    if (!newMessageContent.trim() || !selectedTask) return;

    try {
      await createMessage({
        taskId: selectedTask.id,
        content: newMessageContent,
        type: newMessageType,
        mentions: selectedMentions.length > 0 ? selectedMentions : undefined,
      });
      setNewMessageContent('');
      setNewMessageType('comment');
      setSelectedMentions([]);
      // 스크롤을 맨 아래로
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      // 에러는 스토어에서 처리
    }
  }, [newMessageContent, newMessageType, selectedTask, selectedMentions, createMessage]);

  // 멘션 처리
  const handleMentionSelect = useCallback((memberId: string) => {
    if (!selectedMentions.includes(memberId)) {
      setSelectedMentions([...selectedMentions, memberId]);
    }
    setShowMentionPopup(false);
    setMentionSearch('');
    messageInputRef.current?.focus();
  }, [selectedMentions]);

  // 멘션 제거
  const handleRemoveMention = useCallback((memberId: string) => {
    setSelectedMentions(selectedMentions.filter(id => id !== memberId));
  }, [selectedMentions]);

  // 메시지 입력에서 @ 감지
  const handleMessageInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessageContent(value);

    // @ 입력 감지
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

  // 멘션 필터링된 멤버 목록
  const filteredMentionMembers = useMemo(() => {
    if (!mentionSearch) return members.filter(m => m.status === 'active');
    return members.filter(
      m => m.status === 'active' &&
           (m.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
            m.email.toLowerCase().includes(mentionSearch.toLowerCase()))
    );
  }, [members, mentionSearch]);

  // 메시지 읽음 처리
  const handleMarkAsRead = useCallback((messageId: string) => {
    markMessageAsRead(messageId);
  }, [markMessageAsRead]);

  // 메시지 해결 처리
  const handleResolveMessage = useCallback(async (messageId: string) => {
    await resolveMessage(messageId);
  }, [resolveMessage]);

  // 메시지 시간 포맷
  const formatMessageTime = useCallback((date: Date | { toDate: () => Date }) => {
    const d = date instanceof Date ? date : date.toDate();
    return formatDistanceToNow(d, { addSuffix: true, locale: ko });
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchTasksByProject('default');
    }
  }, [fetchTasksByProject]);

  // 과제 선택 시 메시지 로드
  useEffect(() => {
    if (selectedTask && activeTab === 'messages') {
      fetchMessagesByTask(selectedTask.id);
    }
  }, [selectedTask, activeTab, fetchMessagesByTask]);

  // 타임라인 날짜 범위
  const timelineRange = useMemo(() => {
    const start = startOfMonth(timelineDate);
    const end = endOfMonth(timelineDate);
    const days = eachDayOfInterval({ start, end });
    return { start, end, days };
  }, [timelineDate]);

  // 타임라인에서 과제 위치 계산
  const getTaskBarStyle = useCallback((task: Task) => {
    const startDate = toDate(task.startDate);
    const dueDate = toDate(task.dueDate);

    if (!startDate && !dueDate) return null;

    const taskStart = startDate || dueDate!;
    const taskEnd = dueDate || startDate!;

    const rangeStart = timelineRange.start;
    const rangeEnd = timelineRange.end;
    const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;

    // 과제가 현재 월 범위와 겹치는지 확인
    if (taskEnd < rangeStart || taskStart > rangeEnd) return null;

    const effectiveStart = taskStart < rangeStart ? rangeStart : taskStart;
    const effectiveEnd = taskEnd > rangeEnd ? rangeEnd : taskEnd;

    const leftOffset = differenceInDays(effectiveStart, rangeStart);
    const duration = differenceInDays(effectiveEnd, effectiveStart) + 1;

    const leftPercent = (leftOffset / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 3)}%`, // 최소 3% 너비
    };
  }, [timelineRange]);

  // 뷰 아이콘
  const viewIcons: Record<ViewType, React.ReactNode> = {
    list: <List className="h-4 w-4" />,
    board: <Kanban className="h-4 w-4" />,
    timeline: <GanttChart className="h-4 w-4" />,
    calendar: <Calendar className="h-4 w-4" />,
  };

  // 뷰 라벨
  const viewLabels: Record<ViewType, string> = {
    list: '리스트',
    board: '보드',
    timeline: '타임라인',
    calendar: '캘린더',
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6" />
            과제 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            과제를 다양한 뷰로 관리하세요
          </p>
        </div>
        <Button onClick={handleNewTask}>
          <Plus className="h-4 w-4 mr-2" />
          새 과제
        </Button>
      </div>

      {/* 뷰 탭 */}
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

      {/* 현재 뷰 콘텐츠 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {viewIcons[currentView]}
            {viewLabels[currentView]} 뷰
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isTasksLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">과제 목록을 불러오는 중...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">등록된 과제가 없습니다</p>
              <Button onClick={handleNewTask}>
                <Plus className="h-4 w-4 mr-2" />
                첫 번째 과제 추가
              </Button>
            </div>
          ) : (
            <>
              {/* List View */}
              {currentView === 'list' && (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
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
                        {STATUS_LABELS[task.status]}
                      </Badge>
                      <Badge
                        style={{
                          backgroundColor: TASK_PRIORITY_COLORS[task.priority],
                        }}
                      >
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {(task.dueDate instanceof Date
                            ? task.dueDate
                            : task.dueDate.toDate()
                          ).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Board View with Drag & Drop */}
              {currentView === 'board' && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {(['todo', 'in_progress', 'review', 'delayed_complete', 'done'] as TaskStatus[]).map((status) => {
                    const statusTasks = tasks.filter((t) => t.status === status);
                    const isDragOver = dragOverStatus === status;
                    return (
                      <div
                        key={status}
                        className="space-y-2"
                        onDragOver={(e) => handleDragOver(e, status)}
                        onDragLeave={() => setDragOverStatus(null)}
                        onDrop={(e) => handleDrop(e, status)}
                      >
                        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: TASK_STATUS_COLORS[status] }}
                            />
                            <span className="font-medium text-sm">{STATUS_LABELS[status]}</span>
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
                                onDragStart={() => handleDragStart(task.id)}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleTaskClick(task)}
                                className={`p-3 border rounded-lg bg-background hover:shadow-md cursor-grab active:cursor-grabbing transition-all ${
                                  isDragging ? 'opacity-50 scale-95 ring-2 ring-primary' : ''
                                }`}
                              >
                                <p className="font-medium text-sm mb-2">{task.title}</p>
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
                              여기에 놓기
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Timeline View (Gantt Chart) */}
              {currentView === 'timeline' && (
                <div className="space-y-4">
                  {/* 타임라인 헤더 - 월 네비게이션 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setTimelineDate(subMonths(timelineDate, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="font-medium min-w-[120px] text-center">
                        {format(timelineDate, 'yyyy년 M월', { locale: ko })}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setTimelineDate(addMonths(timelineDate, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTimelineDate(new Date())}
                      >
                        오늘
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((status) => (
                        <div key={status} className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: TASK_STATUS_COLORS[status] }}
                          />
                          <span className="text-muted-foreground">{STATUS_LABELS[status]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 타임라인 그리드 */}
                  <div className="border rounded-lg overflow-hidden">
                    {/* 날짜 헤더 */}
                    <div className="flex border-b bg-muted/50">
                      <div className="w-48 min-w-48 p-2 border-r font-medium text-sm">
                        과제명
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

                    {/* 과제 행들 */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {tasks.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          이 기간에 표시할 과제가 없습니다
                        </div>
                      ) : (
                        tasks.map((task) => {
                          const barStyle = getTaskBarStyle(task);
                          return (
                            <div
                              key={task.id}
                              className="flex border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                            >
                              {/* 과제 정보 */}
                              <div className="w-48 min-w-48 p-2 border-r flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: TASK_STATUS_COLORS[task.status] }}
                                />
                                <span className="text-sm truncate" title={task.title}>
                                  {task.title}
                                </span>
                              </div>
                              {/* 간트 바 영역 */}
                              <div className="flex-1 relative h-10">
                                {/* 그리드 라인 */}
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
                                {/* 과제 바 */}
                                {barStyle && (
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2 h-6 rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center px-1"
                                    style={{
                                      ...barStyle,
                                      backgroundColor: TASK_STATUS_COLORS[task.status],
                                    }}
                                    title={`${task.title}\n시작: ${toDate(task.startDate)?.toLocaleDateString('ko-KR') || '-'}\n마감: ${toDate(task.dueDate)?.toLocaleDateString('ko-KR') || '-'}`}
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

                  {/* 오늘 마커 설명 */}
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary/10 border border-primary/30 rounded" />
                    오늘
                  </div>
                </div>
              )}

              {/* Calendar View - 전용 캘린더 페이지로 안내 */}
              {currentView === 'calendar' && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    과제 마감일을 캘린더에서 확인하세요
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/projects/calendar'}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    캘린더 페이지로 이동
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 과제 상세/추가 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setActiveTab('details');
          setNewMessageContent('');
          setSelectedMentions([]);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedTask ? '과제 상세' : '새 과제 추가'}
            </DialogTitle>
            <DialogDescription>
              {selectedTask ? '과제 정보와 커뮤니케이션을 관리하세요.' : '새로운 과제를 추가하세요.'}
            </DialogDescription>
          </DialogHeader>

          {/* 탭 전환 (기존 과제인 경우에만) */}
          {selectedTask && (
            <div className="flex border-b">
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('details')}
              >
                <CheckCircle2 className="h-4 w-4 inline mr-2" />
                상세 정보
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'messages'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('messages')}
              >
                <MessageSquare className="h-4 w-4" />
                커뮤니케이션
                {messages.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {messages.length}
                  </Badge>
                )}
              </button>
            </div>
          )}

          {/* 상세 정보 탭 */}
          {activeTab === 'details' && (
            <div className="grid gap-4 py-4 overflow-y-auto">
              {/* 제목 */}
              <div className="grid gap-2">
                <Label htmlFor="task-title">제목 *</Label>
                <Input
                  id="task-title"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  placeholder="과제 제목"
                />
              </div>

              {/* 설명 */}
              <div className="grid gap-2">
                <Label htmlFor="task-description">설명</Label>
                <Textarea
                  id="task-description"
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  placeholder="과제 설명"
                  rows={3}
                />
              </div>

              {/* 상태 및 우선순위 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>상태</Label>
                  <Select
                    value={taskFormData.status}
                    onValueChange={(value) => setTaskFormData({ ...taskFormData, status: value as TaskStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="상태 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: TASK_STATUS_COLORS[status] }}
                            />
                            {STATUS_LABELS[status]}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>우선순위</Label>
                  <Select
                    value={taskFormData.priority}
                    onValueChange={(value) => setTaskFormData({ ...taskFormData, priority: value as TaskPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="우선순위 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: TASK_PRIORITY_COLORS[priority] }}
                            />
                            {PRIORITY_LABELS[priority]}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 시작일 및 마감일 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-start-date">시작일</Label>
                  <Input
                    id="task-start-date"
                    type="date"
                    value={taskFormData.startDate}
                    onChange={(e) => setTaskFormData({ ...taskFormData, startDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-due-date">마감일</Label>
                  <Input
                    id="task-due-date"
                    type="date"
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* 담당자 표시 (기존 과제인 경우) */}
              {selectedTask && selectedTask.assignees.length > 0 && (
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    담당자
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.assignees.map((assigneeId) => {
                      const member = getMemberById(assigneeId);
                      return (
                        <Badge key={assigneeId} variant="secondary">
                          {member?.name || assigneeId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 커뮤니케이션 탭 */}
          {activeTab === 'messages' && selectedTask && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* 메시지 목록 */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 py-4">
                  {isMessagesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">메시지 불러오는 중...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">아직 메시지가 없습니다</p>
                      <p className="text-xs text-muted-foreground mt-1">첫 번째 메시지를 남겨보세요</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const sender = getMemberById(message.senderId);
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.isResolved ? 'opacity-60' : ''}`}
                          onMouseEnter={() => handleMarkAsRead(message.id)}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={sender?.photoURL} />
                            <AvatarFallback className="text-xs">
                              {sender?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {sender?.name || '알 수 없음'}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge
                                      variant="outline"
                                      className="h-5 px-1.5 text-xs"
                                      style={{
                                        borderColor: MESSAGE_TYPE_COLORS[message.type],
                                        color: MESSAGE_TYPE_COLORS[message.type],
                                      }}
                                    >
                                      <MessageTypeIcon type={message.type} className="h-3 w-3 mr-1" />
                                      {MESSAGE_TYPE_LABELS[message.type]}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {MESSAGE_TYPE_LABELS[message.type]} 메시지
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.createdAt)}
                              </span>
                              {message.isResolved && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                  <CheckCheck className="h-3 w-3 mr-1" />
                                  해결됨
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </div>
                            {/* 멘션된 사용자 표시 */}
                            {message.mentions && message.mentions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {message.mentions.map((mentionId) => {
                                  const mentionedMember = getMemberById(mentionId);
                                  return (
                                    <Badge
                                      key={mentionId}
                                      variant="secondary"
                                      className="h-5 px-1.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                    >
                                      <AtSign className="h-3 w-3 mr-0.5" />
                                      {mentionedMember?.name || mentionId}
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                            {/* 읽음 표시 */}
                            {Object.keys(message.readBy).length > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                <CheckCheck className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {Object.keys(message.readBy).length}명이 읽음
                                </span>
                              </div>
                            )}
                            {/* 해결 버튼 (질문/요청인 경우) */}
                            {!message.isResolved && (message.type === 'question' || message.type === 'request') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 mt-2 text-xs"
                                onClick={() => handleResolveMessage(message.id)}
                              >
                                <CheckCheck className="h-3 w-3 mr-1" />
                                해결됨으로 표시
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

              {/* 메시지 입력 영역 */}
              <div className="space-y-3">
                {/* 멘션된 사용자 표시 */}
                {selectedMentions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedMentions.map((mentionId) => {
                      const member = getMemberById(mentionId);
                      return (
                        <Badge
                          key={mentionId}
                          variant="secondary"
                          className="h-6 px-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        >
                          <AtSign className="h-3 w-3 mr-0.5" />
                          {member?.name || mentionId}
                          <button
                            className="ml-1 hover:text-red-500"
                            onClick={() => handleRemoveMention(mentionId)}
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* 메시지 타입 선택 */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs">메시지 타입:</Label>
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

                {/* 메시지 입력 */}
                <div className="relative">
                  <Textarea
                    ref={messageInputRef}
                    value={newMessageContent}
                    onChange={handleMessageInputChange}
                    placeholder="메시지를 입력하세요... (@로 멘션)"
                    rows={2}
                    className="pr-12 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
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

                  {/* 멘션 팝업 */}
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
                            <AvatarFallback className="text-xs">
                              {member.name.charAt(0)}
                            </AvatarFallback>
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

                <p className="text-xs text-muted-foreground">
                  Enter로 전송, Shift+Enter로 줄바꿈
                </p>
              </div>
            </div>
          )}

          {/* 푸터 (상세 탭일 때만) */}
          {activeTab === 'details' && (
            <DialogFooter className="flex justify-between">
              {selectedTask && (
                <Button variant="destructive" onClick={handleDeleteTask}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleSaveTask} disabled={!taskFormData.title || isTasksLoading}>
                  {isTasksLoading ? '저장 중...' : selectedTask ? '수정' : '추가'}
                </Button>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
