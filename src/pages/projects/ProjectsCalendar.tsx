/**
 * 프로젝트 캘린더 페이지
 *
 * react-big-calendar를 사용한 일정 관리
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Repeat,
  Bell,
  Link2,
  FileText,
  Clock,
  Trash2,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { useAuthStore } from '@/stores/authStore';
import { CATEGORY_COLORS, TASK_STATUS_COLORS } from '@/types/project';
import type { CalendarEvent, Task, RecurrenceType, Recurrence, EventReminder } from '@/types/project';
import type { TrainingSession } from '@/types';

// date-fns localizer 설정
const locales = { ko };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// 캘린더 이벤트 타입
interface CalendarEventItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: CalendarEvent;
  taskResource?: Task;
  sessionResource?: TrainingSession;
  type: 'event' | 'task' | 'session';
  color?: string;
}

// 교육 세션 상태별 색상
const SESSION_STATUS_COLORS: Record<string, string> = {
  PLANNED: '#F59E0B',    // Amber
  COMPLETED: '#10B981',  // Green
  CANCELLED: '#6B7280',  // Gray
};

// 알림 프리셋 (분 단위)
const REMINDER_PRESETS = [
  { value: '0', labelKey: 'projects.calendar.atTime' },
  { value: '5', labelKey: 'projects.calendar.minutesBefore', n: 5 },
  { value: '10', labelKey: 'projects.calendar.minutesBefore', n: 10 },
  { value: '15', labelKey: 'projects.calendar.minutesBefore', n: 15 },
  { value: '30', labelKey: 'projects.calendar.minutesBefore', n: 30 },
  { value: '60', labelKey: 'projects.calendar.hoursBefore', n: 1 },
  { value: '120', labelKey: 'projects.calendar.hoursBefore', n: 2 },
  { value: '1440', labelKey: 'projects.calendar.daysBefore', n: 1 },
  { value: '2880', labelKey: 'projects.calendar.daysBefore', n: 2 },
  { value: '10080', labelKey: 'projects.calendar.weekBefore' },
];

// 새 이벤트 폼 타입
interface EventFormData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  categoryId: string;
  location: string;
  url: string;
  recurrenceType: RecurrenceType | 'none';
  recurrenceInterval: number;
  recurrenceEndType: 'never' | 'onDate' | 'afterCount';
  recurrenceEndDate: Date;
  recurrenceEndCount: number;
  reminderMinutes: number | null; // null = no reminder
}

const defaultFormData: EventFormData = {
  title: '',
  description: '',
  startDate: new Date(),
  endDate: addHours(new Date(), 1),
  allDay: false,
  categoryId: '',
  location: '',
  url: '',
  recurrenceType: 'none',
  recurrenceInterval: 1,
  recurrenceEndType: 'never',
  recurrenceEndDate: addMonths(new Date(), 3),
  recurrenceEndCount: 10,
  reminderMinutes: null,
};

export default function ProjectsCalendar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    events,
    tasks,
    categories,
    error,
    fetchEvents,
    fetchAllTasks,
    fetchCategories,
    createEvent,
    updateEvent,
    deleteEvent,
    isLoading,
  } = useProjectStore();
  const { sessions, fetchSessions } = useTrainingStore();
  const { user } = useAuthStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(defaultFormData);
  const initializedRef = useRef(false);

  // 초기 데이터 로드
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      Promise.all([
        fetchCategories(),
        fetchAllTasks(),
        fetchSessions(),
      ]);
    }
  }, [fetchCategories, fetchAllTasks, fetchSessions]);

  // 날짜 범위 변경 시 이벤트 로드
  useEffect(() => {
    const loadEvents = async () => {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      await fetchEvents(start, end);
    };
    loadEvents();
  }, [currentDate, fetchEvents]);

  // Date로 변환하는 헬퍼 함수
  const toDate = (value: Date | { toDate: () => Date } | string | number): Date => {
    if (value instanceof Date) return value;
    if (typeof value === 'object' && 'toDate' in value) return value.toDate();
    return new Date(value);
  };

  // 이벤트 + 과제를 캘린더 형식으로 변환
  const calendarEvents: CalendarEventItem[] = useMemo(() => {
    const eventItems: CalendarEventItem[] = events.map((event) => {
      const category = categories.find((c) => c.id === event.categoryId);
      const recurrencePrefix = event.recurrence ? '🔁 ' : '';
      return {
        id: event.id,
        title: `${recurrencePrefix}${event.title}`,
        start: toDate(event.startDate),
        end: toDate(event.endDate),
        allDay: event.allDay,
        resource: event,
        type: 'event' as const,
        color: category?.color || CATEGORY_COLORS[0],
      };
    });

    const taskItems: CalendarEventItem[] = tasks
      .filter((task) => task.startDate || task.dueDate)
      .map((task) => {
        const prefix = task.status === 'done' ? '✓ ' : '◆ ';
        const start = task.startDate ? toDate(task.startDate) : toDate(task.dueDate!);
        const end = task.dueDate ? toDate(task.dueDate) : start;
        return {
          id: `task-${task.id}`,
          title: `${prefix}${task.title}`,
          start,
          end,
          allDay: true,
          taskResource: task,
          type: 'task' as const,
          color: TASK_STATUS_COLORS[task.status],
        };
      });

    // 교육 세션을 캘린더 아이템으로 변환
    const sessionItems: CalendarEventItem[] = sessions
      .filter((s) => s.session_date && s.status !== 'CANCELLED')
      .map((session) => {
        const sessionDate = new Date(session.session_date);
        const statusIcon = session.status === 'COMPLETED' ? '✅ ' : '📚 ';
        return {
          id: `session-${session.session_id}`,
          title: `${statusIcon}${session.trainer_name || '교육'} - ${session.location || ''}`.trim(),
          start: sessionDate,
          end: sessionDate,
          allDay: true,
          sessionResource: session,
          type: 'session' as const,
          color: SESSION_STATUS_COLORS[session.status] || '#F59E0B',
        };
      });

    return [...eventItems, ...taskItems, ...sessionItems];
  }, [events, tasks, sessions, categories]);

  // 이벤트 스타일 커스텀
  const eventStyleGetter = useCallback((event: CalendarEventItem) => {
    if (event.type === 'task') {
      return {
        style: {
          backgroundColor: 'transparent',
          borderRadius: '4px',
          opacity: 0.9,
          color: event.color || '#6B7280',
          border: `2px solid ${event.color || '#6B7280'}`,
          display: 'block',
          fontSize: '0.8em',
        },
      };
    }
    if (event.type === 'session') {
      return {
        style: {
          backgroundColor: event.color || '#F59E0B',
          borderRadius: '4px',
          opacity: 0.85,
          color: 'white',
          border: 'none',
          display: 'block',
          fontSize: '0.8em',
        },
      };
    }
    return {
      style: {
        backgroundColor: event.color || '#3b82f6',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  }, []);

  // 새 이벤트 생성 다이얼로그 열기
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedEvent(null);
    const isAllDay = slotInfo.action === 'select' && slotInfo.slots.length > 1;
    setFormData({
      ...defaultFormData,
      startDate: slotInfo.start,
      endDate: slotInfo.end || addHours(slotInfo.start, 1),
      allDay: isAllDay,
    });
    setIsDialogOpen(true);
  }, []);

  // 기존 이벤트 또는 과제 클릭
  const handleSelectEvent = useCallback((event: CalendarEventItem) => {
    if (event.type === 'task') {
      navigate('/projects/tasks');
      return;
    }
    if (event.type === 'session') {
      navigate('/schedule');
      return;
    }
    if (event.resource) {
      const ev = event.resource;
      const rec = ev.recurrence;
      const reminder = ev.reminders?.[0];
      setSelectedEvent(ev);
      setFormData({
        title: ev.title,
        description: ev.description || '',
        startDate: event.start,
        endDate: event.end,
        allDay: event.allDay || false,
        categoryId: ev.categoryId || '',
        location: ev.location || '',
        url: (ev as CalendarEvent & { url?: string }).url || '',
        recurrenceType: rec?.type || 'none',
        recurrenceInterval: rec?.interval || 1,
        recurrenceEndType: rec?.endDate ? 'onDate' : rec?.endCount ? 'afterCount' : 'never',
        recurrenceEndDate: rec?.endDate ? toDate(rec.endDate) : addMonths(new Date(), 3),
        recurrenceEndCount: rec?.endCount || 10,
        reminderMinutes: reminder ? reminder.minutes : null,
      });
      setIsDialogOpen(true);
    }
  }, [navigate]);

  // 반복 설정 빌드
  const buildRecurrence = (): Recurrence | undefined => {
    if (formData.recurrenceType === 'none') return undefined;
    const rec: Recurrence = {
      type: formData.recurrenceType,
      interval: formData.recurrenceInterval,
    };
    if (formData.recurrenceEndType === 'onDate') {
      rec.endDate = formData.recurrenceEndDate;
    } else if (formData.recurrenceEndType === 'afterCount') {
      rec.endCount = formData.recurrenceEndCount;
    }
    return rec;
  };

  // 알림 설정 빌드
  const buildReminders = (): EventReminder[] | undefined => {
    if (formData.reminderMinutes === null) return undefined;
    return [{ type: 'in_app', minutes: formData.reminderMinutes }];
  };

  // 폼 제출
  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    const recurrence = buildRecurrence();
    const reminders = buildReminders();

    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, {
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          allDay: formData.allDay,
          categoryId: formData.categoryId || undefined,
          location: formData.location || undefined,
          recurrence,
          reminders,
        });
      } else {
        await createEvent({
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          allDay: formData.allDay,
          categoryId: formData.categoryId,
          location: formData.location || undefined,
          recurrence,
          reminders,
          attendees: [],
          createdBy: user?.id || '',
        });
      }
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      setSelectedEvent(null);
    } catch {
      // 에러는 스토어에서 처리
    }
  };

  // 이벤트 삭제
  const handleDelete = async () => {
    if (selectedEvent && confirm('이 일정을 삭제하시겠습니까?')) {
      await deleteEvent(selectedEvent.id);
      setIsDialogOpen(false);
      setSelectedEvent(null);
    }
  };

  // 캘린더 메시지 i18n
  const messages = {
    today: t('projects.calendar.today'),
    previous: t('projects.calendar.previous'),
    next: t('projects.calendar.next'),
    month: t('projects.calendar.monthView'),
    week: t('projects.calendar.weekView'),
    day: t('projects.calendar.dayView'),
    agenda: t('projects.calendar.title'),
    date: t('projects.calendar.dayView'),
    time: t('projects.calendar.dayView'),
    event: t('projects.calendar.newEvent'),
    noEventsInRange: t('projects.calendar.noEvents'),
    showMore: (count: number) => `+${count}`,
  };

  // 일정 카테고리 필터링을 위한 카테고리 (event 타입만)
  const eventCategories = categories.filter((c) => c.type === 'event');

  // 현재 선택된 카테고리 (다이얼로그용)
  const selectedCategory = useMemo(
    () => eventCategories.find((c) => c.id === formData.categoryId),
    [eventCategories, formData.categoryId]
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            {t('projects.calendar.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('projects.calendar.description')}
          </p>
        </div>
        <Button onClick={() => {
          setSelectedEvent(null);
          setFormData(defaultFormData);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          {t('projects.calendar.newEvent')}
        </Button>
      </div>

      {/* 에러 배너 */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 범례 */}
      <div className="flex flex-wrap gap-2">
        {/* 일정 카테고리 */}
        {eventCategories.map((category) => (
          <Badge
            key={category.id}
            variant="outline"
            style={{
              borderColor: category.color,
              backgroundColor: category.color + '20',
            }}
          >
            <div
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
          </Badge>
        ))}

        {/* 교육 세션 범례 */}
        <div className="w-px h-5 bg-border self-center mx-1" />
        <Badge variant="outline" className="gap-1" style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
          <GraduationCap className="h-3 w-3" />
          교육(예정)
        </Badge>
        <Badge variant="outline" className="gap-1" style={{ borderColor: '#10B981', color: '#10B981' }}>
          <GraduationCap className="h-3 w-3" />
          교육(완료)
        </Badge>

        {/* 과제 범례 */}
        <div className="w-px h-5 bg-border self-center mx-1" />
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          과제
        </Badge>
        {(Object.entries(TASK_STATUS_COLORS) as [string, string][]).slice(0, 4).map(([status, color]) => {
          const labels: Record<string, string> = {
            todo: '할 일',
            in_progress: '진행중',
            delayed_start: '지연(시작)',
            delayed_complete: '지연(완료)',
          };
          return (
            <Badge
              key={status}
              variant="outline"
              style={{
                borderColor: color,
                color,
              }}
            >
              ◆ {labels[status] || status}
            </Badge>
          );
        })}
      </div>

      {/* 캘린더 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentDate(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
            >
              {t('projects.calendar.today')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentDate(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              messages={messages}
              culture="ko"
              popup
              views={['month', 'week', 'day', 'agenda']}
            />
          </div>
        </CardContent>
      </Card>

      {/* 일정 추가/수정 다이얼로그 — Apple Calendar 스타일 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
          {/* Color Strip — 선택된 카테고리 색상 */}
          <div
            className="h-2 w-full transition-colors duration-200"
            style={{
              backgroundColor: selectedCategory?.color || '#3B82F6',
            }}
          />

          <DialogHeader className="px-6 pt-5 pb-0">
            <DialogTitle className="text-xl">
              {selectedEvent ? t('projects.calendar.editEvent') : t('projects.calendar.newEvent')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {selectedEvent ? t('projects.calendar.editEventDesc') : t('projects.calendar.newEventDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* 일정명 — 큰 입력 필드 (Apple 스타일) */}
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('projects.calendar.eventTitle')}
              className="text-lg font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary h-12"
            />

            {/* 카테고리 선택 (색상 도트 포함) */}
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{
                  backgroundColor: selectedCategory?.color || '#3B82F6',
                  boxShadow: `0 0 0 2px white, 0 0 0 4px ${selectedCategory?.color || '#3B82F6'}`,
                }}
              />
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger className="border-0 shadow-none px-0 h-8 focus:ring-0">
                  <SelectValue placeholder={t('projects.tasks.category')} />
                </SelectTrigger>
                <SelectContent>
                  {eventCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 구분선 */}
            <div className="border-t" />

            {/* 종일 토글 */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {t('projects.calendar.allDay')}
              </Label>
              <Switch
                checked={formData.allDay}
                onCheckedChange={(checked) => setFormData({ ...formData, allDay: checked })}
              />
            </div>

            {/* 날짜/시간 — 2행 1열 (Apple Calendar 스타일) */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('projects.calendar.startDate')}
                </Label>
                <Input
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  value={formData.allDay
                    ? format(formData.startDate, 'yyyy-MM-dd')
                    : format(formData.startDate, "yyyy-MM-dd'T'HH:mm")
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: new Date(e.target.value) })
                  }
                  className="border-0 bg-transparent shadow-none px-0 h-9 text-base focus-visible:ring-0"
                />
              </div>
              <div className="border-t" />
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('projects.calendar.endDate')}
                </Label>
                <Input
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  value={formData.allDay
                    ? format(formData.endDate, 'yyyy-MM-dd')
                    : format(formData.endDate, "yyyy-MM-dd'T'HH:mm")
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: new Date(e.target.value) })
                  }
                  className="border-0 bg-transparent shadow-none px-0 h-9 text-base focus-visible:ring-0"
                />
              </div>
            </div>

            {/* 반복 일정 */}
            <div className="flex items-center gap-3">
              <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={formData.recurrenceType}
                onValueChange={(value) =>
                  setFormData({ ...formData, recurrenceType: value as RecurrenceType | 'none' })
                }
              >
                <SelectTrigger className="border-0 shadow-none px-0 h-8 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('projects.calendar.noRepeat')}</SelectItem>
                  <SelectItem value="daily">{t('projects.calendar.daily')}</SelectItem>
                  <SelectItem value="weekly">{t('projects.calendar.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('projects.calendar.monthly')}</SelectItem>
                  <SelectItem value="yearly">{t('projects.calendar.yearly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 반복 상세 설정 */}
            {formData.recurrenceType !== 'none' && (
              <div className="ml-7 space-y-3 rounded-lg border bg-muted/30 p-3">
                {/* 반복 간격 */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm shrink-0">{t('projects.calendar.every')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={formData.recurrenceInterval}
                    onChange={(e) =>
                      setFormData({ ...formData, recurrenceInterval: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-16 h-8 text-center"
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.recurrenceType === 'daily' && t('projects.calendar.days')}
                    {formData.recurrenceType === 'weekly' && t('projects.calendar.weeks')}
                    {formData.recurrenceType === 'monthly' && t('projects.calendar.months')}
                    {formData.recurrenceType === 'yearly' && t('projects.calendar.years')}
                  </span>
                </div>
                {/* 반복 종료 */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    {t('projects.calendar.repeatEnd')}
                  </Label>
                  <Select
                    value={formData.recurrenceEndType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, recurrenceEndType: value as 'never' | 'onDate' | 'afterCount' })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">{t('projects.calendar.never')}</SelectItem>
                      <SelectItem value="onDate">{t('projects.calendar.onDate')}</SelectItem>
                      <SelectItem value="afterCount">{t('projects.calendar.afterCount')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.recurrenceEndType === 'onDate' && (
                    <Input
                      type="date"
                      value={format(formData.recurrenceEndDate, 'yyyy-MM-dd')}
                      onChange={(e) =>
                        setFormData({ ...formData, recurrenceEndDate: new Date(e.target.value) })
                      }
                      className="h-8"
                    />
                  )}
                  {formData.recurrenceEndType === 'afterCount' && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={999}
                        value={formData.recurrenceEndCount}
                        onChange={(e) =>
                          setFormData({ ...formData, recurrenceEndCount: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        className="w-20 h-8 text-center"
                      />
                      <span className="text-sm text-muted-foreground">{t('projects.calendar.times')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 구분선 */}
            <div className="border-t" />

            {/* 알림 */}
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={formData.reminderMinutes === null ? 'none' : String(formData.reminderMinutes)}
                onValueChange={(value) =>
                  setFormData({ ...formData, reminderMinutes: value === 'none' ? null : parseInt(value) })
                }
              >
                <SelectTrigger className="border-0 shadow-none px-0 h-8 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('projects.calendar.noReminder')}</SelectItem>
                  {REMINDER_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.n !== undefined
                        ? t(preset.labelKey, { n: preset.n })
                        : t(preset.labelKey)
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 장소 */}
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t('projects.calendar.location')}
                className="border-0 shadow-none px-0 h-8 focus-visible:ring-0"
              />
            </div>

            {/* URL */}
            <div className="flex items-center gap-3">
              <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder={t('projects.calendar.url')}
                className="border-0 shadow-none px-0 h-8 focus-visible:ring-0"
              />
            </div>

            {/* 구분선 */}
            <div className="border-t" />

            {/* 메모 */}
            <div className="flex gap-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('projects.calendar.notes')}
                rows={3}
                className="border-0 shadow-none px-0 resize-none focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Footer — Apple 스타일 */}
          <div className="border-t px-6 py-4 flex items-center justify-between bg-muted/30">
            {selectedEvent ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('common.delete')}
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.title || isLoading}
                style={{ backgroundColor: selectedCategory?.color || undefined }}
              >
                {isLoading ? t('common.saving') : selectedEvent ? t('common.edit') : t('common.add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
