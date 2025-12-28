import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Settings,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/common/LoadingSpinner';
import {
  NewTQCStatsCards,
  NewTQCTeamStats,
  MeetingListItem,
  TraineeStatusBadge,
  TrainingStageProgress,
} from '@/components/new-tqc';
import {
  useNewTQCDashboardStats,
  useNewTQCTrainees,
  useNewTQCUpcomingMeetings,
  useNewTQCLoading,
  useNewTQCActions,
} from '@/stores/newTqcStore';

export default function NewTQCDashboard() {
  const navigate = useNavigate();

  const dashboardStats = useNewTQCDashboardStats();
  const trainees = useNewTQCTrainees();
  const upcomingMeetings = useNewTQCUpcomingMeetings();
  const loading = useNewTQCLoading();
  const { fetchDashboardStats, fetchTrainees, fetchUpcomingMeetings } = useNewTQCActions();

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchDashboardStats(),
        fetchTrainees(),
        fetchUpcomingMeetings(7),
      ]);
    };
    fetchData();
  }, []);

  if (loading.dashboard && !dashboardStats) {
    return <PageLoading />;
  }

  // Get recently added trainees (last 5)
  const recentTrainees = [...trainees]
    .filter((t) => t.status === 'IN_TRAINING')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">신입 TQC 교육</h1>
          <p className="text-muted-foreground">
            신입 교육생 관리 및 교육 현황 대시보드
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/new-tqc/trainees/new')}>
            <Plus className="h-4 w-4 mr-2" />
            교육생 등록
          </Button>
          <Button variant="outline" onClick={() => navigate('/new-tqc/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            설정
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <NewTQCStatsCards stats={dashboardStats} isLoading={loading.dashboard} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Trainees */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                최근 등록 교육생
              </CardTitle>
              <CardDescription>최근 등록된 신입 교육생</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/new-tqc/trainees')}
            >
              전체보기
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentTrainees.length > 0 ? (
              <div className="space-y-3">
                {recentTrainees.map((trainee) => (
                  <div
                    key={trainee.trainee_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/new-tqc/trainees/${trainee.trainee_id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{trainee.name}</span>
                        <TraineeStatusBadge status={trainee.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{trainee.team_id}</span>
                        <span>•</span>
                        <span>{trainee.trainer_id}</span>
                        <span>•</span>
                        <span>{trainee.start_week}주차</span>
                      </div>
                    </div>
                    <div className="w-24">
                      <TrainingStageProgress
                        stages={[]} // Would need to fetch stages for each trainee
                      />
                      <div className="text-xs text-muted-foreground text-right mt-1">
                        {trainee.progress_percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>등록된 교육생이 없습니다.</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/new-tqc/trainees/new')}
                >
                  교육생 등록하기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                예정된 미팅
              </CardTitle>
              <CardDescription>7일 이내 예정된 미팅</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/new-tqc/meetings')}
            >
              전체보기
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-2">
                {upcomingMeetings.slice(0, 5).map((meeting) => (
                  <MeetingListItem
                    key={meeting.meeting_id}
                    meeting={meeting}
                    onClick={() => navigate(`/new-tqc/meetings?id=${meeting.meeting_id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>예정된 미팅이 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Stats */}
        <NewTQCTeamStats stats={dashboardStats} />

        {/* Alerts / Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              주의 필요 항목
            </CardTitle>
            <CardDescription>조치가 필요한 항목들</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Pending Color Blind Tests */}
              {dashboardStats && dashboardStats.colorBlindPending > 0 && (
                <div
                  className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg cursor-pointer hover:bg-yellow-500/20 transition-colors"
                  onClick={() => navigate('/new-tqc/trainees?color_blind=null')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-full">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Color Blind 검사 필요</p>
                      <p className="text-sm text-muted-foreground">
                        {dashboardStats.colorBlindPending}명의 교육생이 검사를 받지 않았습니다.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {/* No alerts */}
              {(!dashboardStats || dashboardStats.colorBlindPending === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>현재 주의가 필요한 항목이 없습니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
