/**
 * 프로젝트 캘린더 페이지
 *
 * react-big-calendar를 사용한 일정 관리
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { CATEGORY_COLORS } from '@/types/project';
import type { CalendarEvent } from '@/types/project';

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
  color?: string;
}

// 새 이벤트 폼 타입
interface EventFormData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  categoryId: string;
  location: string;
}

const defaultFormData: EventFormData = {
  title: '',
  description: '',
  startDate: new Date(),
  endDate: addHours(new Date(), 1),
  allDay: false,
  categoryId: '',
  location: '',
};

export default function ProjectsCalendar() {
  const { t } = useTranslation();
  const {
    events,
    categories,
    error,
    fetchEvents,
    fetchCategories,
    createEvent,
    updateEvent,
    deleteEvent,
    isLoading,
  } = useProjectStore();
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
      fetchCategories();
    }
  }, [fetchCategories]);

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

  // 이벤트를 캘린더 형식으로 변환
  const calendarEvents: CalendarEventItem[] = useMemo(() => {
    return events.map((event) => {
      const category = categories.find((c) => c.id === event.categoryId);
      return {
        id: event.id,
        title: event.title,
        start: toDate(event.startDate),
        end: toDate(event.endDate),
        allDay: event.allDay,
        resource: event,
        color: category?.color || CATEGORY_COLORS[0],
      };
    });
  }, [events, categories]);

  // 이벤트 스타일 커스텀
  const eventStyleGetter = useCallback((event: CalendarEventItem) => {
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
    setFormData({
      ...defaultFormData,
      startDate: slotInfo.start,
      endDate: slotInfo.end,
      allDay: slotInfo.action === 'select' && slotInfo.slots.length > 1,
    });
    setIsDialogOpen(true);
  }, []);

  // 기존 이벤트 클릭
  const handleSelectEvent = useCallback((event: CalendarEventItem) => {
    if (event.resource) {
      setSelectedEvent(event.resource);
      setFormData({
        title: event.resource.title,
        description: event.resource.description || '',
        startDate: event.start,
        endDate: event.end,
        allDay: event.allDay || false,
        categoryId: event.resource.categoryId || '',
        location: event.resource.location || '',
      });
      setIsDialogOpen(true);
    }
  }, []);

  // 폼 제출
  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    try {
      if (selectedEvent) {
        // 수정
        await updateEvent(selectedEvent.id, {
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          allDay: formData.allDay,
          categoryId: formData.categoryId || undefined,
          location: formData.location || undefined,
        });
      } else {
        // 생성
        await createEvent({
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          allDay: formData.allDay,
          categoryId: formData.categoryId,
          location: formData.location || undefined,
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

      {/* 카테고리 범례 */}
      {eventCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
        </div>
      )}

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

      {/* 일정 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? t('projects.calendar.editEvent') : t('projects.calendar.newEvent')}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent ? t('projects.calendar.editEventDesc') : t('projects.calendar.newEventDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{t('projects.calendar.eventTitle')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('projects.calendar.eventTitle')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t('projects.calendar.eventDescription')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('projects.calendar.eventDescription')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">{t('projects.calendar.startDate')}</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={format(formData.startDate, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: new Date(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">{t('projects.calendar.endDate')}</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={format(formData.endDate, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: new Date(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t('projects.tasks.category')}</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
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

            <div className="grid gap-2">
              <Label htmlFor="location">{t('projects.calendar.location')}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t('projects.calendar.location')}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {selectedEvent && (
              <Button variant="destructive" onClick={handleDelete}>
                {t('common.delete')}
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.title || isLoading}>
                {isLoading ? t('common.saving') : selectedEvent ? t('common.edit') : t('common.add')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
