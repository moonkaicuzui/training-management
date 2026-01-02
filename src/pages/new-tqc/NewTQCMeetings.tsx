import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  List,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoading } from '@/components/common/LoadingSpinner';
import {
  MeetingScheduleCard,
  MeetingListItem,
  MeetingFilters,
} from '@/components/new-tqc';
import {
  useNewTQCMeetings,
  useNewTQCTrainees,
  useNewTQCMeetingFilters,
  useNewTQCLoading,
  useNewTQCActions,
} from '@/stores/newTqcStore';
import type { NewTQCMeetingFilters as FiltersType } from '@/types/newTqc';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isPast, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function NewTQCMeetings() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const meetings = useNewTQCMeetings();
  const trainees = useNewTQCTrainees();
  const filters = useNewTQCMeetingFilters();
  const loading = useNewTQCLoading();
  const { fetchMeetings, fetchTrainees, setMeetingFilters, updateMeeting } = useNewTQCActions();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchMeetings(filters), fetchTrainees()]);
      } catch {
        toast({
          variant: 'destructive',
          title: '데이터 로드 실패',
          description: '미팅 데이터를 불러오는데 실패했습니다.',
        });
      }
    };
    fetchData();
  }, [filters]);

  // Get trainee name by ID
  const getTraineeName = (traineeId: string) => {
    return trainees.find((t) => t.trainee_id === traineeId)?.name || traineeId;
  };

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      if (filters.meetingType && filters.meetingType !== 'all' && meeting.meeting_type !== filters.meetingType) return false;
      if (filters.status && filters.status !== 'all' && meeting.status !== filters.status) return false;
      if (filters.dateFrom && meeting.scheduled_date < filters.dateFrom) return false;
      if (filters.dateTo && meeting.scheduled_date > filters.dateTo) return false;
      return true;
    });
  }, [meetings, filters]);

  // Group meetings by status
  const scheduledMeetings = filteredMeetings.filter((m) => m.status === 'SCHEDULED');
  const completedMeetings = filteredMeetings.filter((m) => m.status === 'COMPLETED');
  const missedMeetings = filteredMeetings.filter((m) => m.status === 'MISSED');
  const overdueMeetings = scheduledMeetings.filter((m) => isPast(new Date(m.scheduled_date)) && !isToday(new Date(m.scheduled_date)));

  // Get current week dates for calendar view
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  const handleFiltersChange = (newFilters: FiltersType) => {
    setMeetingFilters(newFilters);
  };

  const handleClearFilters = () => {
    setMeetingFilters({});
  };

  const handleMeetingComplete = async (meetingId: string) => {
    try {
      await updateMeeting({
        meeting_id: meetingId,
        status: 'COMPLETED',
        completed_date: new Date().toISOString().split('T')[0],
      });
      await fetchMeetings(filters);
      toast({
        title: '미팅 완료',
        description: '미팅이 완료 처리되었습니다.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: '업데이트 실패',
        description: '미팅 상태 변경에 실패했습니다.',
      });
    }
  };

  if (loading.meetings && meetings.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">미팅 관리</h1>
          <p className="text-muted-foreground">
            신입 교육생 면담 일정 관리
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              예정된 미팅
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledMeetings.length}</div>
          </CardContent>
        </Card>
        <Card className={overdueMeetings.length > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              지연된 미팅
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueMeetings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-status-pass" />
              완료된 미팅
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-pass">{completedMeetings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              미실시
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{missedMeetings.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <MeetingFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        </CardContent>
      </Card>

      {/* Meetings View */}
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            목록
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            캘린더
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-6">
          {/* Overdue Meetings */}
          {overdueMeetings.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  지연된 미팅 ({overdueMeetings.length})
                </CardTitle>
                <CardDescription>
                  예정일이 지났으나 완료되지 않은 미팅입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {overdueMeetings.map((meeting) => (
                    <MeetingScheduleCard
                      key={meeting.meeting_id}
                      meeting={meeting}
                      traineeName={getTraineeName(meeting.trainee_id)}
                      onComplete={handleMeetingComplete}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scheduled Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                예정된 미팅 ({scheduledMeetings.filter((m) => !overdueMeetings.includes(m)).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledMeetings.filter((m) => !overdueMeetings.includes(m)).length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {scheduledMeetings
                    .filter((m) => !overdueMeetings.includes(m))
                    .map((meeting) => (
                      <MeetingScheduleCard
                        key={meeting.meeting_id}
                        meeting={meeting}
                        traineeName={getTraineeName(meeting.trainee_id)}
                        onComplete={handleMeetingComplete}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  예정된 미팅이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-status-pass" />
                완료된 미팅 ({completedMeetings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedMeetings.length > 0 ? (
                <div className="space-y-2">
                  {completedMeetings.slice(0, 10).map((meeting) => (
                    <MeetingListItem
                      key={meeting.meeting_id}
                      meeting={meeting}
                      traineeName={getTraineeName(meeting.trainee_id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  완료된 미팅이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(currentWeekStart, 'yyyy년 M월', { locale: ko })} 주간 일정
              </CardTitle>
              <CardDescription>
                {format(currentWeekStart, 'M월 d일', { locale: ko })} - {format(currentWeekEnd, 'M월 d일', { locale: ko })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`text-center p-2 font-medium ${
                      isToday(day) ? 'bg-primary text-primary-foreground rounded-t-lg' : ''
                    }`}
                  >
                    <div className="text-sm">{format(day, 'EEE', { locale: ko })}</div>
                    <div className="text-lg">{format(day, 'd')}</div>
                  </div>
                ))}

                {/* Day Contents */}
                {weekDays.map((day) => {
                  const dayMeetings = scheduledMeetings.filter((m) =>
                    isSameDay(new Date(m.scheduled_date), day)
                  );

                  return (
                    <div
                      key={`content-${day.toISOString()}`}
                      className={`min-h-[120px] p-2 border rounded-lg ${
                        isToday(day) ? 'border-primary' : ''
                      }`}
                    >
                      {dayMeetings.length > 0 ? (
                        <div className="space-y-1">
                          {dayMeetings.map((meeting) => (
                            <div
                              key={meeting.meeting_id}
                              className="p-2 bg-primary/10 rounded text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                              onClick={() =>
                                navigate(`/new-tqc/trainees/${meeting.trainee_id}`)
                              }
                            >
                              <div className="font-medium truncate">
                                {getTraineeName(meeting.trainee_id)}
                              </div>
                              <div className="text-muted-foreground">
                                {meeting.meeting_type === '1WEEK'
                                  ? '1주'
                                  : meeting.meeting_type === '1MONTH'
                                    ? '1개월'
                                    : '3개월'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground text-xs pt-4">
                          -
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
