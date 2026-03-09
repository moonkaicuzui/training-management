import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Clock, MapPin, User, Users, MoreHorizontal, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShallow } from 'zustand/react/shallow';
import { useTrainingStore } from '@/stores/trainingStore';
import { useUIStore } from '@/stores/uiStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import { ko, vi, enUS } from 'date-fns/locale';
import type { TrainingSession, SessionStatus, TrainingType, TrainingLevel } from '@/types';
import { TRAINING_TYPES, TRAINING_LEVELS } from '@/data/constants';

type ViewMode = 'day' | 'week' | 'month';

const WEEKDAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7:00 ~ 19:00

export default function Schedule() {
  const { t } = useTranslation();
  const { sessions, programs, loading, fetchSessions, fetchPrograms, createSession, cancelSession } = useTrainingStore(useShallow((state) => ({
    sessions: state.sessions,
    programs: state.programs,
    loading: state.loading,
    fetchSessions: state.fetchSessions,
    fetchPrograms: state.fetchPrograms,
    createSession: state.createSession,
    cancelSession: state.cancelSession,
  })));
  const { addToast, language } = useUIStore(useShallow((state) => ({
    addToast: state.addToast,
    language: state.language,
  })));

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    program_code: '',
    session_date: '',
    session_time: '09:00',
    trainer: '',
    location: '',
    max_attendees: 20,
    training_level: '' as TrainingLevel | '',
    training_type: '' as TrainingType | '',
    notes: '',
  });

  const getLocale = () => {
    switch (language) {
      case 'ko': return ko;
      case 'vi': return vi;
      default: return enUS;
    }
  };

  useEffect(() => {
    Promise.all([
      fetchSessions({
        status: statusFilter !== 'all' ? statusFilter as SessionStatus : undefined,
      }),
      fetchPrograms({}),
    ]).catch(() => {});
  }, [statusFilter]);

  // Navigation handlers based on view mode
  const handlePrev = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar data calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Week view data
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Get current period title based on view mode
  const getPeriodTitle = () => {
    const locale = getLocale();
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'PPP (E)', { locale });
      case 'week':
        return `${format(weekStart, 'MMM d', { locale })} - ${format(weekEnd, 'MMM d', { locale })}`;
      case 'month':
        return format(currentDate, 'yyyy MMMM', { locale });
    }
  };

  // Get sessions count for current period
  const getCurrentPeriodSessionsCount = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return sessions.filter(s => isSameDay(new Date(s.session_date), currentDate)).length;
      case 'week':
        return sessions.filter(s => {
          const date = new Date(s.session_date);
          return date >= weekStart && date <= weekEnd;
        }).length;
      case 'month':
        return sessions.filter(s => isSameMonth(new Date(s.session_date), currentDate)).length;
    }
  }, [sessions, currentDate, viewMode, weekStart, weekEnd]);

  // Get sessions by hour for day/week view
  const getSessionsForHour = (date: Date, hour: number) => {
    return sessions.filter(session => {
      if (!isSameDay(new Date(session.session_date), date)) return false;
      const sessionHour = parseInt(session.session_time.split(':')[0], 10);
      return sessionHour === hour;
    });
  };

  const getSessionsForDate = (date: Date) => {
    return sessions.filter((session) =>
      isSameDay(new Date(session.session_date), date)
    );
  };

  const getStatusBadgeVariant = (status: string) => {
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
  };

  const handleCreateSession = async () => {
    if (!formData.program_code || !formData.session_date) {
      addToast({
        type: 'error',
        title: t('schedule.requiredFieldsError'),
      });
      return;
    }

    try {
      await createSession({
        program_code: formData.program_code,
        session_date: formData.session_date,
        session_time: formData.session_time,
        trainer: formData.trainer,
        trainer_name: formData.trainer,
        location: formData.location,
        max_attendees: formData.max_attendees,
        training_level: formData.training_level || undefined,
        training_type: formData.training_type || undefined,
        notes: formData.notes,
        status: 'PLANNED',
        attendees: [],
        created_by: 'admin',
      });
      addToast({
        type: 'success',
        title: t('messages.saveSuccess'),
      });
      setCreateDialogOpen(false);
      setFormData({
        program_code: '',
        session_date: '',
        session_time: '09:00',
        trainer: '',
        location: '',
        max_attendees: 20,
        training_level: '',
        training_type: '',
        notes: '',
      });
    } catch {
      addToast({
        type: 'error',
        title: t('messages.saveError'),
      });
    }
  };

  const handleCancelSession = async () => {
    if (!sessionToCancel) return;

    try {
      await cancelSession(sessionToCancel);
      addToast({
        type: 'success',
        title: t('schedule.cancelSuccess'),
      });
    } catch {
      addToast({
        type: 'error',
        title: t('schedule.cancelError'),
      });
    } finally {
      setCancelDialogOpen(false);
      setSessionToCancel(null);
    }
  };

  if (loading.sessions) {
    return <PageLoading />;
  }

  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('session.title')}</h1>
          <p className="text-muted-foreground">
            {t('schedule.pageDescription')}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('session.addSession')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{getPeriodTitle()}</CardTitle>
                <CardDescription>
                  {t('schedule.sessionsCount', { count: getCurrentPeriodSessionsCount })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleToday}>
                  {t('schedule.today')}
                </Button>
                <Button variant="outline" size="icon" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="day" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('schedule.dayView')}</span>
                </TabsTrigger>
                <TabsTrigger value="week" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('schedule.weekView')}</span>
                </TabsTrigger>
                <TabsTrigger value="month" className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('schedule.monthView')}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {/* Day View */}
            {viewMode === 'day' && (
              <div className="space-y-2">
                <div className="grid grid-cols-[60px_1fr] gap-2">
                  {HOURS.map((hour) => {
                    const hourSessions = getSessionsForHour(currentDate, hour);
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
                              onClick={() => setSelectedSession(session)}
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
            )}

            {/* Week View */}
            {viewMode === 'week' && (
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
                            {format(day, 'E', { locale: getLocale() })}
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
                          const hourSessions = getSessionsForHour(day, hour);
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
                                  onClick={() => setSelectedSession(session)}
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
            )}

            {/* Month View */}
            {viewMode === 'month' && (
              <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
                {/* Weekday headers */}
                {WEEKDAY_KEYS.map((key, index) => {
                  // Use date-fns to get locale-aware weekday abbreviations
                  const refDate = new Date(2024, 0, 7 + index); // 2024-01-07 is Sunday
                  return (
                    <div
                      key={key}
                      className="bg-background p-2 text-center text-sm font-medium text-muted-foreground"
                    >
                      {format(refDate, 'EEEEE', { locale: getLocale() })}
                    </div>
                  );
                })}

                {/* Calendar days */}
                {calendarDays.map((day) => {
                  const daySessions = getSessionsForDate(day);
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
                      onClick={() => setSelectedDate(day)}
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
            )}
          </CardContent>
        </Card>

        {/* Selected Date Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? format(selectedDate, 'PPP', { locale: getLocale() })
                : t('schedule.selectDate')}
            </CardTitle>
            <CardDescription>
              {t('schedule.sessionsCount', { count: selectedDateSessions.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('schedule.clickCalendar')}
              </div>
            ) : selectedDateSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('schedule.noSessions')}
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateSessions.map((session) => (
                  <div
                    key={session.session_id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-1">
                          {session.program_code}
                        </Badge>
                        <p className="font-medium">
                          {programs.find(p => p.program_code === session.program_code)?.program_name || session.program_code}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedSession(session)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('schedule.viewDetail')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          {session.status === 'PLANNED' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSessionToCancel(session.session_id);
                                  setCancelDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('schedule.cancelSession')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{session.session_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{session.location || t('common.tbd')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{session.trainer || t('common.tbd')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{t('schedule.attendeesCount', { current: session.attendees.length, max: session.max_attendees })}</span>
                      </div>
                    </div>

                    <Badge variant={getStatusBadgeVariant(session.status)}>
                      {session.status === 'PLANNED' ? t('session.planned') :
                       session.status === 'COMPLETED' ? t('session.completed') :
                       t('session.cancelled')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('schedule.allSchedule')}</CardTitle>
              <CardDescription>
                {t('schedule.allSessions')}
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('schedule.statusPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="PLANNED">{t('session.planned')}</SelectItem>
                <SelectItem value="COMPLETED">{t('session.completed')}</SelectItem>
                <SelectItem value="CANCELLED">{t('session.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.noData')}
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center p-2 bg-muted rounded-lg min-w-[60px]">
                      <div className="text-lg font-bold">
                        {format(new Date(session.session_date), 'd')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(session.session_date), 'MMM', { locale: getLocale() })}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{session.program_code}</Badge>
                        <Badge variant={getStatusBadgeVariant(session.status)}>
                          {session.status === 'PLANNED' ? t('session.planned') :
                           session.status === 'COMPLETED' ? t('session.completed') :
                           t('session.cancelled')}
                        </Badge>
                      </div>
                      <p className="font-medium mt-1">
                        {programs.find(p => p.program_code === session.program_code)?.program_name || session.program_code}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.session_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location || t('common.tbd')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {session.attendees.length}/{session.max_attendees}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSession(session)}
                  >
                    {t('schedule.detail')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Session Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('session.addSession')}</DialogTitle>
            <DialogDescription>
              {t('schedule.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('schedule.programRequired')}</Label>
              <Select
                value={formData.program_code}
                onValueChange={(value) => {
                  const selectedProgram = programs.find(p => p.program_code === value);
                  setFormData({
                    ...formData,
                    program_code: value,
                    training_level: selectedProgram?.training_level || formData.training_level,
                    training_type: selectedProgram?.training_type || formData.training_type,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('schedule.programPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {programs.filter(p => p.is_active).map((program) => (
                    <SelectItem key={program.program_code} value={program.program_code}>
                      {program.program_code} - {program.program_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('schedule.dateRequired')}</Label>
                <Input
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('schedule.time')}</Label>
                <Input
                  type="time"
                  value={formData.session_time}
                  onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('schedule.trainerLabel')}</Label>
              <Input
                value={formData.trainer}
                onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                placeholder={t('schedule.trainerPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('schedule.locationLabel')}</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t('schedule.locationPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('schedule.maxAttendees')}</Label>
              <Input
                type="number"
                value={formData.max_attendees}
                onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) || 20 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('trainingLevel.title')}</Label>
                <Select
                  value={formData.training_level || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, training_level: v === 'none' ? '' : v as TrainingLevel })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {TRAINING_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {t(`trainingLevel.${level.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('trainingType.title')}</Label>
                <Select
                  value={formData.training_type || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, training_type: v === 'none' ? '' : v as TrainingType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {TRAINING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {t(`trainingType.${type.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('schedule.memo')}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('schedule.memoPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateSession}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Session Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('schedule.cancelTitle')}</DialogTitle>
            <DialogDescription>
              {t('schedule.cancelDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleCancelSession}>
              {t('schedule.confirmCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('schedule.detailTitle')}</DialogTitle>
            <DialogDescription>
              {selectedSession?.program_code}
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('schedule.programLabel')}</p>
                  <p className="font-medium">
                    {programs.find(p => p.program_code === selectedSession.program_code)?.program_name || selectedSession.program_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('schedule.statusLabel')}</p>
                  <Badge variant={getStatusBadgeVariant(selectedSession.status)}>
                    {selectedSession.status === 'PLANNED' ? t('session.planned') :
                     selectedSession.status === 'COMPLETED' ? t('session.completed') :
                     t('session.cancelled')}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('schedule.dateLabel')}</p>
                  <p className="font-medium">
                    {format(new Date(selectedSession.session_date), 'PPP (E)', { locale: getLocale() })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('schedule.timeLabel')}</p>
                  <p className="font-medium">{selectedSession.session_time}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('schedule.trainerDetailLabel')}</p>
                  <p className="font-medium">{selectedSession.trainer || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('schedule.locationDetailLabel')}</p>
                  <p className="font-medium">{selectedSession.location || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('schedule.attendeesLabel')}</p>
                <p className="font-medium">
                  {t('schedule.attendeesCount', { current: selectedSession.attendees.length, max: selectedSession.max_attendees })}
                </p>
              </div>
              {selectedSession.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('schedule.memoLabel')}</p>
                  <p>{selectedSession.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedSession(null)}>{t('common.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
