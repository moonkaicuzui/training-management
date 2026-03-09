import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import type { Locale } from 'date-fns';
import type { TrainingSession } from '@/types';

type ViewMode = 'day' | 'week' | 'month';

const WEEKDAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7:00 ~ 19:00

interface ScheduleCalendarProps {
  viewMode: ViewMode;
  currentDate: Date;
  selectedDate: Date | null;
  sessions: TrainingSession[];
  calendarDays: Date[];
  weekDays: Date[];
  locale: Locale;
  onSelectDate: (date: Date) => void;
  onSelectSession: (session: TrainingSession) => void;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'PLANNED':
      return 'default';
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getSessionsForDate(sessions: TrainingSession[], date: Date) {
  return sessions.filter((session) =>
    isSameDay(new Date(session.session_date), date)
  );
}

function getSessionsForHour(sessions: TrainingSession[], date: Date, hour: number) {
  return sessions.filter(session => {
    if (!isSameDay(new Date(session.session_date), date)) return false;
    const sessionHour = parseInt(session.session_time.split(':')[0], 10);
    return sessionHour === hour;
  });
}

export default function ScheduleCalendar({
  viewMode,
  currentDate,
  selectedDate,
  sessions,
  calendarDays,
  weekDays,
  locale,
  onSelectDate,
  onSelectSession,
}: ScheduleCalendarProps) {
  const { t } = useTranslation();

  if (viewMode === 'day') {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-[60px_1fr] gap-2">
          {HOURS.map((hour) => {
            const hourSessions = getSessionsForHour(sessions, currentDate, hour);
            return (
              <div key={hour} className="contents">
                <div className="text-sm text-muted-foreground text-right pr-2 py-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div
                  className={cn(
                    'min-h-[60px] border-t py-2 px-2 rounded-r-lg transition-colors',
                    hourSessions.length > 0 ? 'bg-muted/30' : 'hover:bg-muted/20'
                  )}
                >
                  {hourSessions.map((session) => (
                    <div
                      key={session.session_id}
                      className={cn(
                        'p-2 rounded-md mb-1 cursor-pointer transition-all hover:scale-[1.02]',
                        session.status === 'PLANNED' && 'bg-primary/10 border-l-4 border-primary',
                        session.status === 'COMPLETED' && 'bg-status-pass/10 border-l-4 border-status-pass',
                        session.status === 'CANCELLED' && 'bg-destructive/10 border-l-4 border-destructive opacity-60'
                      )}
                      onClick={() => onSelectSession(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{session.program_code}</div>
                        <Badge variant={getStatusBadgeVariant(session.status)} className="text-xs">
                          {session.status === 'PLANNED' ? t('session.planned') :
                           session.status === 'COMPLETED' ? t('session.completed') :
                           t('session.cancelled')}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.session_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location || t('common.tbd')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (viewMode === 'week') {
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Weekday headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-muted rounded-t-lg overflow-hidden">
            <div className="bg-background p-2" />
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'bg-background p-2 text-center',
                    isToday && 'bg-primary/5'
                  )}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'E', { locale })}
                  </div>
                  <div className={cn(
                    'text-lg font-semibold',
                    isToday && 'text-primary'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Time slots */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-muted">
            {HOURS.map((hour) => (
              <div key={hour} className="contents">
                <div className="bg-background text-sm text-muted-foreground text-right pr-2 py-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDays.map((day) => {
                  const hourSessions = getSessionsForHour(sessions, day, hour);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        'bg-background min-h-[50px] p-1 transition-colors hover:bg-muted/50',
                        isToday && 'bg-primary/5'
                      )}
                    >
                      {hourSessions.map((session) => (
                        <div
                          key={session.session_id}
                          className={cn(
                            'text-xs p-1 rounded truncate cursor-pointer mb-1',
                            session.status === 'PLANNED' && 'bg-primary/20 text-primary',
                            session.status === 'COMPLETED' && 'bg-status-pass/20 text-status-pass',
                            session.status === 'CANCELLED' && 'bg-destructive/20 text-destructive line-through'
                          )}
                          onClick={() => onSelectSession(session)}
                          title={`${session.program_code} - ${session.session_time}`}
                        >
                          {session.program_code}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Month view
  return (
    <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
      {/* Weekday headers */}
      {WEEKDAY_KEYS.map((key, index) => {
        const refDate = new Date(2024, 0, 7 + index); // 2024-01-07 is Sunday
        return (
          <div
            key={key}
            className="bg-background p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {format(refDate, 'EEEEE', { locale })}
          </div>
        );
      })}

      {/* Calendar days */}
      {calendarDays.map((day) => {
        const daySessions = getSessionsForDate(sessions, day);
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());

        return (
          <div
            key={day.toISOString()}
            className={cn(
              'bg-background p-2 min-h-[100px] cursor-pointer transition-colors hover:bg-muted/50',
              !isCurrentMonth && 'text-muted-foreground/50',
              isSelected && 'ring-2 ring-primary ring-inset',
              isToday && 'bg-primary/5'
            )}
            onClick={() => onSelectDate(day)}
          >
            <div className={cn('text-sm font-medium mb-1', isToday && 'text-primary')}>
              {format(day, 'd')}
            </div>
            <div className="space-y-1">
              {daySessions.slice(0, 2).map((session) => (
                <div
                  key={session.session_id}
                  className={cn(
                    'text-xs p-1 rounded truncate',
                    session.status === 'PLANNED' && 'bg-primary/10 text-primary',
                    session.status === 'COMPLETED' && 'bg-status-pass/10 text-status-pass',
                    session.status === 'CANCELLED' && 'bg-destructive/10 text-destructive line-through'
                  )}
                >
                  {session.program_code}
                </div>
              ))}
              {daySessions.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{daySessions.length - 2}{t('common.count')}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
