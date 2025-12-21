import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Clock, MapPin, User, Users, MoreHorizontal, Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useTrainingStore } from '@/stores/trainingStore';
import { useUIStore } from '@/stores/uiStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ko, vi, enUS } from 'date-fns/locale';
import type { TrainingSession } from '@/types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function Schedule() {
  const { t } = useTranslation();
  const { sessions, programs, loading, fetchSessions, fetchPrograms, createSession, cancelSession } = useTrainingStore();
  const { addToast, language } = useUIStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
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
    fetchSessions({
      status: statusFilter !== 'all' ? statusFilter as any : undefined,
    });
    fetchPrograms({});
  }, [statusFilter]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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
        title: '필수 정보를 입력해주세요',
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
        notes: '',
      });
    } catch (error) {
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
        title: '교육이 취소되었습니다',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '교육 취소에 실패했습니다',
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
            교육 일정을 관리하고 참석자를 등록하세요
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {format(currentMonth, 'yyyy년 M월', { locale: getLocale() })}
              </CardTitle>
              <CardDescription>
                이번 달 교육 일정 {sessions.filter(s =>
                  isSameMonth(new Date(s.session_date), currentMonth)
                ).length}건
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
              {/* Weekday headers */}
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="bg-background p-2 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const daySessions = getSessionsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={index}
                    className={`
                      bg-background p-2 min-h-[100px] cursor-pointer transition-colors
                      ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
                      ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}
                      ${isToday ? 'bg-primary/5' : ''}
                      hover:bg-muted/50
                    `}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {daySessions.slice(0, 2).map((session) => (
                        <div
                          key={session.session_id}
                          className={`
                            text-xs p-1 rounded truncate
                            ${session.status === 'PLANNED' ? 'bg-primary/10 text-primary' : ''}
                            ${session.status === 'COMPLETED' ? 'bg-status-pass/10 text-status-pass' : ''}
                            ${session.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive line-through' : ''}
                          `}
                        >
                          {session.program_code}
                        </div>
                      ))}
                      {daySessions.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{daySessions.length - 2}건
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? format(selectedDate, 'M월 d일 (E)', { locale: getLocale() })
                : '날짜를 선택하세요'}
            </CardTitle>
            <CardDescription>
              {selectedDateSessions.length}건의 교육
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <div className="text-center py-8 text-muted-foreground">
                캘린더에서 날짜를 클릭하세요
              </div>
            ) : selectedDateSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                예정된 교육이 없습니다
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
                            상세 보기
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
                                교육 취소
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
                        <span>{session.location || '미정'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{session.trainer || '미정'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{session.attendees.length} / {session.max_attendees}명</span>
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
              <CardTitle>전체 교육 일정</CardTitle>
              <CardDescription>
                예정된 모든 교육 세션
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태" />
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
                          {session.location || '미정'}
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
                    상세
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
              새로운 교육 세션을 생성합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>프로그램 *</Label>
              <Select
                value={formData.program_code}
                onValueChange={(value) => setFormData({ ...formData, program_code: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="프로그램 선택" />
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
                <Label>교육 날짜 *</Label>
                <Input
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>교육 시간</Label>
                <Input
                  type="time"
                  value={formData.session_time}
                  onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>강사</Label>
              <Input
                value={formData.trainer}
                onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                placeholder="강사명"
              />
            </div>
            <div className="space-y-2">
              <Label>장소</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="교육 장소"
              />
            </div>
            <div className="space-y-2">
              <Label>최대 참석자 수</Label>
              <Input
                type="number"
                value={formData.max_attendees}
                onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) || 20 })}
              />
            </div>
            <div className="space-y-2">
              <Label>메모</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="추가 메모"
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
            <DialogTitle>교육 취소</DialogTitle>
            <DialogDescription>
              이 교육 세션을 취소하시겠습니까? 참석자들에게 알림이 전송됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleCancelSession}>
              교육 취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>교육 상세 정보</DialogTitle>
            <DialogDescription>
              {selectedSession?.program_code}
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">프로그램</p>
                  <p className="font-medium">
                    {programs.find(p => p.program_code === selectedSession.program_code)?.program_name || selectedSession.program_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">상태</p>
                  <Badge variant={getStatusBadgeVariant(selectedSession.status)}>
                    {selectedSession.status === 'PLANNED' ? t('session.planned') :
                     selectedSession.status === 'COMPLETED' ? t('session.completed') :
                     t('session.cancelled')}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">날짜</p>
                  <p className="font-medium">
                    {format(new Date(selectedSession.session_date), 'yyyy년 M월 d일 (E)', { locale: getLocale() })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">시간</p>
                  <p className="font-medium">{selectedSession.session_time}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">강사</p>
                  <p className="font-medium">{selectedSession.trainer || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">장소</p>
                  <p className="font-medium">{selectedSession.location || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">참석자</p>
                <p className="font-medium">
                  {selectedSession.attendees.length} / {selectedSession.max_attendees}명
                </p>
              </div>
              {selectedSession.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">메모</p>
                  <p>{selectedSession.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedSession(null)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
