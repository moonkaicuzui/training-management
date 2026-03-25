import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Clock, MapPin, User, Users, MoreHorizontal, Pencil, Trash2, Eye, CalendarDays } from 'lucide-react';
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
import { useShallow } from 'zustand/react/shallow';
import { useTrainingStore } from '@/stores/trainingStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
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
import { logger } from '@/utils/logger';
import type { SessionStatus, TrainingLevel, TrainingType } from '@/types';

import ScheduleCalendar from '@/components/schedule/ScheduleCalendar';
import ScheduleToolbar from '@/components/schedule/ScheduleToolbar';
import SessionFormDialog, { type SessionFormData } from '@/components/schedule/SessionFormDialog';
import SessionDetailDialog from '@/components/schedule/SessionDetailDialog';

type ViewMode = 'day' | 'week' | 'month';

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
  const user = useAuthStore((state) => state.user);

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<import('@/types').TrainingSession | null>(null);

  const [formData, setFormData] = useState<SessionFormData>({
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
    ]).catch((err) => { logger.error('Schedule 초기 데이터 로드 실패:', err); });
  }, [statusFilter]);

  // Navigation handlers
  const handlePrev = () => {
    switch (viewMode) {
      case 'day': setCurrentDate(subDays(currentDate, 1)); break;
      case 'week': setCurrentDate(subWeeks(currentDate, 1)); break;
      case 'month': setCurrentDate(subMonths(currentDate, 1)); break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'day': setCurrentDate(addDays(currentDate, 1)); break;
      case 'week': setCurrentDate(addWeeks(currentDate, 1)); break;
      case 'month': setCurrentDate(addMonths(currentDate, 1)); break;
    }
  };

  const handleToday = () => setCurrentDate(new Date());

  // Calendar data
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const locale = getLocale();

  const getPeriodTitle = () => {
    switch (viewMode) {
      case 'day': return format(currentDate, 'PPP (E)', { locale });
      case 'week': return `${format(weekStart, 'MMM d', { locale })} - ${format(weekEnd, 'MMM d', { locale })}`;
      case 'month': return format(currentDate, 'yyyy MMMM', { locale });
    }
  };

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

  const getSessionsForDate = (date: Date) =>
    sessions.filter((session) => isSameDay(new Date(session.session_date), date));

  const handleCreateSession = async () => {
    if (!formData.program_code || !formData.session_date) {
      addToast({ type: 'error', title: t('schedule.requiredFieldsError') });
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
        created_by: user?.email || user?.name || 'unknown',
      });
      addToast({ type: 'success', title: t('messages.saveSuccess') });
      setCreateDialogOpen(false);
      setFormData({
        program_code: '', session_date: '', session_time: '09:00',
        trainer: '', location: '', max_attendees: 20,
        training_level: '', training_type: '', notes: '',
      });
    } catch {
      addToast({ type: 'error', title: t('messages.saveError') });
    }
  };

  const handleCancelSession = async () => {
    if (!sessionToCancel) return;
    try {
      await cancelSession(sessionToCancel);
      addToast({ type: 'success', title: t('schedule.cancelSuccess') });
    } catch {
      addToast({ type: 'error', title: t('schedule.cancelError') });
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
    <main className="space-y-6" aria-label={t('session.title')}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('session.title')}</h1>
          <p className="text-muted-foreground">{t('schedule.pageDescription')}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('session.addSession')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <ScheduleToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              periodTitle={getPeriodTitle()}
              sessionsCount={getCurrentPeriodSessionsCount}
              onPrev={handlePrev}
              onNext={handleNext}
              onToday={handleToday}
            />
          </CardHeader>
          <CardContent>
            <ScheduleCalendar
              viewMode={viewMode}
              currentDate={currentDate}
              selectedDate={selectedDate}
              sessions={sessions}
              calendarDays={calendarDays}
              weekDays={weekDays}
              locale={locale}
              onSelectDate={setSelectedDate}
              onSelectSession={setSelectedSession}
            />
          </CardContent>
        </Card>

        {/* Selected Date Sessions Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? format(selectedDate, 'PPP', { locale })
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
              <EmptyState
                icon={CalendarDays}
                title={t('schedule.emptyTitle')}
                description={t('schedule.emptyDescription')}
                actionLabel={t('schedule.addSession')}
                onAction={() => setCreateDialogOpen(true)}
              />
            ) : (
              <div className="space-y-4">
                {selectedDateSessions.map((session) => (
                  <div key={session.session_id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-1">{session.program_code}</Badge>
                        <p className="font-medium">
                          {programs.find(p => p.program_code === session.program_code)?.program_name || session.program_code}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={t('common.actions')}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedSession(session)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('schedule.viewDetail')}
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled className="opacity-50">
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
                        <Clock className="h-4 w-4" /><span>{session.session_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" /><span>{session.location || t('common.tbd')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" /><span>{session.trainer || t('common.tbd')}</span>
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

      {/* All Sessions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('schedule.allSchedule')}</CardTitle>
              <CardDescription>{t('schedule.allSessions')}</CardDescription>
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
            <EmptyState
              icon={CalendarDays}
              title={t('schedule.emptyTitle')}
              description={t('schedule.emptyDescription')}
              actionLabel={t('schedule.addSession')}
              onAction={() => setCreateDialogOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center p-2 bg-muted rounded-lg min-w-[60px]">
                      <div className="text-lg font-bold">{format(new Date(session.session_date), 'd')}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(session.session_date), 'MMM', { locale })}
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
                          <Clock className="h-3 w-3" />{session.session_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{session.location || t('common.tbd')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />{session.attendees.length}/{session.max_attendees}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedSession(session)}>
                    {t('schedule.detail')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SessionFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleCreateSession}
        programs={programs}
      />

      {/* Cancel Session Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('schedule.cancelTitle')}</DialogTitle>
            <DialogDescription>{t('schedule.cancelDescription')}</DialogDescription>
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

      <SessionDetailDialog
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        programs={programs}
        locale={locale}
      />
    </main>
  );
}
