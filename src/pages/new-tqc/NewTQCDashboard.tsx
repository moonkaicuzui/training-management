import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Users,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Settings,
  RotateCcw,
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
  const { t } = useTranslation();
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

  // Get trainees who failed the final test and need re-training
  const failedTrainees = trainees.filter(t => t.final_result === 'FAIL');

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
          <h1 className="text-2xl font-bold tracking-tight">{t('newTqc.dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('newTqc.dashboard.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/new-tqc/trainees/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('newTqc.dashboard.registerTrainee')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/new-tqc/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            {t('newTqc.dashboard.settings')}
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
                {t('newTqc.dashboard.recentTrainees')}
              </CardTitle>
              <CardDescription>{t('newTqc.dashboard.recentTraineesDesc')}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/new-tqc/trainees')}
            >
              {t('common.viewAll')}
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
                        <span>{t('newTqc.dashboard.weekLabel', { week: trainee.start_week })}</span>
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
                <p>{t('newTqc.dashboard.noTrainees')}</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/new-tqc/trainees/new')}
                >
                  {t('newTqc.dashboard.registerTrainee')}
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
                {t('newTqc.dashboard.upcomingMeetings')}
              </CardTitle>
              <CardDescription>{t('newTqc.dashboard.upcomingMeetingsDesc')}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/new-tqc/meetings')}
            >
              {t('common.viewAll')}
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
                <p>{t('newTqc.dashboard.noMeetings')}</p>
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
              {t('newTqc.dashboard.alertItems')}
            </CardTitle>
            <CardDescription>{t('newTqc.dashboard.alertItemsDesc')}</CardDescription>
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
                      <p className="font-medium">{t('newTqc.dashboard.colorBlindRequired')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('newTqc.dashboard.colorBlindPending', { count: dashboardStats.colorBlindPending })}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {/* Failed trainees needing re-training */}
              {failedTrainees.length > 0 && (
                <div
                  className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors"
                  onClick={() => navigate('/new-tqc/final-result')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-full">
                      <RotateCcw className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">{t('newTqc.dashboard.retrainingRequired')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('newTqc.dashboard.retrainingCount', { count: failedTrainees.length })}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {/* No alerts */}
              {(!dashboardStats || (dashboardStats.colorBlindPending === 0 && failedTrainees.length === 0)) && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>{t('newTqc.dashboard.noAlerts')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
