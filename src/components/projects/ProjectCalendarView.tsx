/**
 * Project Calendar View - Calendar rendering component
 * react-big-calendar 렌더링 + 범례 필터 + 커스텀 툴바
 */

import { useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View, SlotInfo } from 'react-big-calendar';
import type { ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import type { CalendarEventItem, CalendarCategory } from './calendarTypes';

// date-fns localizer 설정
const locales = { ko };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// 시간 범위 제한: 7AM ~ 8PM
const MIN_TIME = new Date(2020, 0, 1, 7, 0, 0);
const MAX_TIME = new Date(2020, 0, 1, 20, 0, 0);

// 색상 유틸: hex → pastel 배경 + 진한 텍스트
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 59, g: 130, b: 246 };
}

function getPastelStyle(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
    borderLeft: `3px solid ${hex}`,
    color: hex,
  };
}

// ============================================
// Custom Toolbar Component
// ============================================
function CalendarToolbar({ label, onNavigate, onView, view }: ToolbarProps<CalendarEventItem, object>) {
  const { t } = useTranslation();
  const views: { key: View; label: string }[] = [
    { key: 'month', label: t('projects.calendar.monthView') },
    { key: 'week', label: t('projects.calendar.weekView') },
    { key: 'day', label: t('projects.calendar.dayView') },
    { key: 'agenda', label: t('projects.calendar.title') },
  ];

  return (
    <div className="flex items-center justify-between mb-4 px-1">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate('PREV')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs font-medium"
          onClick={() => onNavigate('TODAY')}
        >
          {t('projects.calendar.today')}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate('NEXT')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold ml-2">{label}</span>
      </div>

      {/* Right: View Switcher (segmented control) */}
      <div className="flex items-center bg-muted rounded-lg p-0.5">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => onView(v.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              view === v.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Legend Filter
// ============================================
interface LegendFilterProps {
  eventCategories: CalendarCategory[];
  hiddenTypes: Set<string>;
  showLegend: boolean;
  onToggleFilter: (key: string) => void;
  onToggleLegend: () => void;
  onShowAll: () => void;
}

export function LegendFilter({
  eventCategories,
  hiddenTypes,
  showLegend,
  onToggleFilter,
  onToggleLegend,
  onShowAll,
}: LegendFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <button
        onClick={onToggleLegend}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Filter className="h-3.5 w-3.5" />
        {showLegend ? t('projects.calendar.hideLegend') : t('projects.calendar.showLegend')}
        {hiddenTypes.size > 0 && (
          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
            {t('projects.calendar.hiddenCount', { count: hiddenTypes.size })}
          </Badge>
        )}
      </button>

      {showLegend && (
        <div className="flex flex-wrap gap-1.5">
          {/* 일정 카테고리 */}
          {eventCategories.map((category) => {
            const isHidden = hiddenTypes.has(`cat-${category.id}`);
            return (
              <Badge
                key={category.id}
                variant="outline"
                className={`cursor-pointer select-none transition-all ${
                  isHidden ? 'opacity-40 line-through' : ''
                }`}
                style={{
                  borderColor: category.color,
                  backgroundColor: isHidden ? 'transparent' : category.color + '20',
                }}
                onClick={() => onToggleFilter(`cat-${category.id}`)}
              >
                <div
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </Badge>
            );
          })}

          {/* 교육 세션 범례 */}
          <div className="w-px h-5 bg-border self-center mx-0.5" />
          <Badge
            variant="outline"
            className={`gap-1 cursor-pointer select-none transition-all ${
              hiddenTypes.has('sessions') ? 'opacity-40 line-through' : ''
            }`}
            style={{ borderColor: '#F59E0B', color: '#F59E0B' }}
            onClick={() => onToggleFilter('sessions')}
          >
            <GraduationCap className="h-3 w-3" />
            {t('projects.calendar.training')}
          </Badge>

          {/* 과제 범례 */}
          <div className="w-px h-5 bg-border self-center mx-0.5" />
          <Badge
            variant="outline"
            className={`gap-1 cursor-pointer select-none transition-all ${
              hiddenTypes.has('tasks') ? 'opacity-40 line-through' : ''
            }`}
            style={{ borderColor: '#6B7280', color: '#6B7280' }}
            onClick={() => onToggleFilter('tasks')}
          >
            <CheckCircle2 className="h-3 w-3" />
            {t('projects.calendar.taskLabel')}
          </Badge>

          {/* 필터 초기화 */}
          {hiddenTypes.size > 0 && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 text-xs"
              onClick={onShowAll}
            >
              {t('projects.calendar.showAll')}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Calendar View
// ============================================
interface ProjectCalendarViewProps {
  calendarEvents: CalendarEventItem[];
  currentDate: Date;
  currentView: View;
  onDateChange: (date: Date) => void;
  onViewChange: (view: View) => void;
  onSelectSlot: (slotInfo: SlotInfo) => void;
  onSelectEvent: (event: CalendarEventItem) => void;
}

export const ProjectCalendarView = memo(function ProjectCalendarView({
  calendarEvents,
  currentDate,
  currentView,
  onDateChange,
  onViewChange,
  onSelectSlot,
  onSelectEvent,
}: ProjectCalendarViewProps) {
  const { t } = useTranslation();

  // 이벤트 스타일 — Apple Calendar: pastel bg + left border + dark text
  const eventStyleGetter = useCallback((event: CalendarEventItem) => {
    if (event.type === 'task') {
      return {
        style: {
          backgroundColor: 'transparent',
          borderRadius: '6px',
          opacity: 0.9,
          color: event.color || '#6B7280',
          border: `2px solid ${event.color || '#6B7280'}`,
          display: 'block' as const,
          fontSize: '12px',
          padding: '1px 4px',
        },
      };
    }
    if (event.type === 'session') {
      return {
        style: {
          backgroundColor: event.color || '#F59E0B',
          borderRadius: '6px',
          opacity: 0.85,
          color: 'white',
          border: 'none',
          display: 'block' as const,
          fontSize: '12px',
          padding: '1px 4px',
        },
      };
    }
    // Events — pastel style with left border
    const baseColor = event.color || '#3b82f6';
    const pastel = getPastelStyle(baseColor);
    return {
      style: {
        ...pastel,
        borderRadius: '6px',
        display: 'block' as const,
        fontSize: '12px',
        fontWeight: 500,
        padding: '1px 6px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
      },
    };
  }, []);

  // 캘린더 메시지 i18n
  const messages = useMemo(() => ({
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
  }), [t]);

  // Custom toolbar components map
  const calendarComponents = useMemo(() => ({
    toolbar: CalendarToolbar,
  }), []);

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-4">
        <div className="h-[650px]">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={currentView}
            onView={onViewChange}
            date={currentDate}
            onNavigate={onDateChange}
            selectable
            onSelectSlot={onSelectSlot}
            onSelectEvent={onSelectEvent}
            eventPropGetter={eventStyleGetter}
            messages={messages}
            culture="ko"
            popup
            views={['month', 'week', 'day', 'agenda']}
            min={MIN_TIME}
            max={MAX_TIME}
            components={calendarComponents}
          />
        </div>
      </CardContent>
    </Card>
  );
});
