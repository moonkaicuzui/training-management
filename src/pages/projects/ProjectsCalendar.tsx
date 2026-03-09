/**
 * 프로젝트 캘린더 페이지 (Orchestrator)
 *
 * Apple Calendar 스타일 react-big-calendar 일정 관리
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { View, SlotInfo } from 'react-big-calendar';
import { addHours } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useProjectStore } from '@/stores/projectStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { useAuthStore } from '@/stores/authStore';
import { CATEGORY_COLORS } from '@/types/project';
import type { CalendarEvent } from '@/types/project';

// Sub-components
import { ProjectCalendarView, LegendFilter } from '@/components/projects/ProjectCalendarView';
import { CalendarTaskDialog } from '@/components/projects/CalendarTaskDialog';
import {
  defaultFormData,
  buildRecurrence,
  buildReminders,
  eventToFormData,
  buildCalendarEvents,
} from '@/components/projects/CalendarEventDetails';
import type { EventFormData, CalendarCategory } from '@/components/projects/calendarTypes';

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
    createCategory,
    createEvent,
    updateEvent,
    deleteEvent,
    isLoading,
  } = useProjectStore(useShallow((state) => ({ events: state.events, tasks: state.tasks, categories: state.categories, error: state.error, fetchEvents: state.fetchEvents, fetchAllTasks: state.fetchAllTasks, fetchCategories: state.fetchCategories, createCategory: state.createCategory, createEvent: state.createEvent, updateEvent: state.updateEvent, deleteEvent: state.deleteEvent, isLoading: state.isLoading })));
  const { sessions, fetchSessions } = useTrainingStore(useShallow((state) => ({ sessions: state.sessions, fetchSessions: state.fetchSessions })));
  const user = useAuthStore((s) => s.user);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(defaultFormData);
  const initializedRef = useRef(false);

  // Legend filter state
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [showLegend, setShowLegend] = useState(true);

  // 인라인 카테고리 생성 상태
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[10]);
  const seededRef = useRef(false);

  const toggleFilter = useCallback((key: string) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

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

  // 기본 카테고리 자동 시딩: 카테고리가 0개이면 기본 4개 생성
  useEffect(() => {
    if (seededRef.current || categories.length > 0) return;
    seededRef.current = true;
    const seedDefaults = async () => {
      const defaults = [
        { name: '활동', color: '#3B82F6', type: 'event' as const },
        { name: 'TECH', color: '#8B5CF6', type: 'event' as const },
        { name: '활동', color: '#3B82F6', type: 'task' as const },
        { name: 'TECH', color: '#8B5CF6', type: 'task' as const },
      ];
      for (const d of defaults) {
        await createCategory(d.name, d.color, d.type);
      }
    };
    seedDefaults();
  }, [categories.length, createCategory]);

  // 날짜 범위 변경 시 이벤트 로드
  useEffect(() => {
    const loadEvents = async () => {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      await fetchEvents(start, end);
    };
    loadEvents();
  }, [currentDate, fetchEvents]);

  // 일정 카테고리 (event 타입만)
  const eventCategories = useMemo(
    () => categories.filter((c) => c.type === 'event') as CalendarCategory[],
    [categories]
  );

  // 이벤트 + 과제를 캘린더 형식으로 변환 + 필터
  const calendarEvents = useMemo(
    () => buildCalendarEvents(
      events,
      tasks,
      sessions,
      categories as CalendarCategory[],
      hiddenTypes,
      t('projects.calendar.training')
    ),
    [events, tasks, sessions, categories, hiddenTypes, t]
  );

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
  const handleSelectEvent = useCallback((event: { type: string; resource?: CalendarEvent; start: Date; end: Date; allDay?: boolean }) => {
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
      setSelectedEvent(ev);
      setFormData(eventToFormData(ev, event.start, event.end, event.allDay || false));
      setIsDialogOpen(true);
    }
  }, [navigate]);

  // 폼 제출
  const handleSubmit = useCallback(async () => {
    if (!formData.title.trim()) return;

    const recurrence = buildRecurrence(formData);
    const reminders = buildReminders(formData);

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
  }, [formData, selectedEvent, updateEvent, createEvent, user]);

  // 이벤트 삭제
  const handleDelete = useCallback(async () => {
    if (selectedEvent && confirm(t('projects.calendar.deleteConfirm'))) {
      await deleteEvent(selectedEvent.id);
      setIsDialogOpen(false);
      setSelectedEvent(null);
    }
  }, [selectedEvent, deleteEvent, t]);

  // 현재 선택된 카테고리 (다이얼로그용)
  const selectedCategory = useMemo(
    () => eventCategories.find((c) => c.id === formData.categoryId),
    [eventCategories, formData.categoryId]
  );

  // 인라인 카테고리 생성 핸들러
  const handleCreateCategory = useCallback(async () => {
    const created = await createCategory(newCategoryName.trim(), newCategoryColor, 'event');
    setFormData((prev) => ({ ...prev, categoryId: created.id }));
    setIsNewCategoryMode(false);
    setIsCategoryPopoverOpen(false);
  }, [createCategory, newCategoryName, newCategoryColor]);

  return (
    <div className="space-y-4">
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

      {/* 범례 필터 */}
      <LegendFilter
        eventCategories={eventCategories}
        hiddenTypes={hiddenTypes}
        showLegend={showLegend}
        onToggleFilter={toggleFilter}
        onToggleLegend={() => setShowLegend(!showLegend)}
        onShowAll={() => setHiddenTypes(new Set())}
      />

      {/* 캘린더 */}
      <ProjectCalendarView
        calendarEvents={calendarEvents}
        currentDate={currentDate}
        currentView={currentView}
        onDateChange={setCurrentDate}
        onViewChange={setCurrentView}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
      />

      {/* 일정 추가/수정 다이얼로그 */}
      <CalendarTaskDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={formData}
        onFormDataChange={setFormData}
        selectedEvent={selectedEvent}
        isLoading={isLoading}
        eventCategories={eventCategories}
        selectedCategory={selectedCategory}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        isCategoryPopoverOpen={isCategoryPopoverOpen}
        onCategoryPopoverChange={setIsCategoryPopoverOpen}
        isNewCategoryMode={isNewCategoryMode}
        onNewCategoryModeChange={setIsNewCategoryMode}
        newCategoryName={newCategoryName}
        onNewCategoryNameChange={setNewCategoryName}
        newCategoryColor={newCategoryColor}
        onNewCategoryColorChange={setNewCategoryColor}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
}
