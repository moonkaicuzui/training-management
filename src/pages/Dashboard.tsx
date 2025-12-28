import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Plus,
  ClipboardCheck,
  Clock,
  Calendar,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LazyBarChart, LazyPieChart, Bar } from '@/components/charts/LazyCharts';
import { useNormalizedTrainingStore } from '@/stores';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';

const GRADE_COLORS = {
  AA: '#059669',
  A: '#10B981',
  B: '#F59E0B',
  C: '#EF4444',
};

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    derived,
    loading,
    fetchDashboardStats,
    fetchMonthlyData,
    fetchGradeDistribution,
    fetchRetrainingTargets,
    fetchExpiringTrainings,
  } = useNormalizedTrainingStore();

  // Extract data from derived state
  const dashboardStats = derived.dashboard.stats;
  const monthlyData = derived.dashboard.monthlyData;
  const gradeDistribution = derived.dashboard.gradeDistribution;
  const retrainingTargets = derived.retraining.targets;
  const expiringTrainings = derived.retraining.expiring;

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setError(null);
        // 병렬로 모든 데이터 가져오기 (성능 개선)
        await Promise.all([
          fetchDashboardStats(),
          fetchMonthlyData(),
          fetchGradeDistribution(),
          fetchRetrainingTargets(),
          fetchExpiringTrainings(30),
        ]);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(t('messages.loadError'));
      }
    };
    fetchAllData();
  }, []);

  if (loading.views.dashboard) {
    return <PageLoading />;
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const stats = [
    {
      title: t('dashboard.totalEmployees'),
      value: dashboardStats?.totalEmployees ?? 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/employees',
      trend: null, // Could add month-over-month change
    },
    {
      title: t('dashboard.monthlyCompletions'),
      value: dashboardStats?.monthlyCompletions ?? 0,
      icon: GraduationCap,
      color: 'text-status-pass',
      bgColor: 'bg-status-pass/10',
      link: '/results',
      trend: null,
    },
    {
      title: t('dashboard.completionRate'),
      value: `${dashboardStats?.overallCompletionRate ?? 0}%`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/results',
      trend: null,
    },
    {
      title: t('dashboard.retrainingNeeded'),
      value: dashboardStats?.retrainingCount ?? 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      link: '/retraining',
      trend: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.welcome')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/schedule')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('dashboard.newTraining')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/results')}>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            {t('dashboard.enterResults')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group"
            onClick={() => navigate(stat.link)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(stat.link)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.trend !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={stat.trend > 0 ? 'text-status-pass' : 'text-destructive'}>
                    {stat.trend > 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
                  </span>
                  {' '}{t('dashboard.fromLastMonth')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.monthlyChart')}</CardTitle>
            <CardDescription>{t('dashboard.plannedVsCompleted')}</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <GraduationCap className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('dashboard.noMonthlyData')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  {t('dashboard.noMonthlyDataDesc')}
                </p>
                <Button onClick={() => navigate('/schedule')} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('dashboard.scheduleTraining')}
                </Button>
              </div>
            ) : (
              <LazyBarChart
                data={monthlyData}
                height={300}
                xAxisKey="month"
                xAxisFormatter={(value) => value.substring(5)}
              >
                <Bar dataKey="planned" name={t('dashboard.planned')} fill="#93C5FD" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name={t('dashboard.completed')} fill="#1E40AF" radius={[4, 4, 0, 0]} />
              </LazyBarChart>
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.gradeDistribution')}</CardTitle>
            <CardDescription>{t('dashboard.gradeDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {gradeDistribution.length === 0 || gradeDistribution.every(g => g.count === 0) ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <TrendingUp className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('dashboard.noGradeData')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  {t('dashboard.noGradeDataDesc')}
                </p>
                <Button onClick={() => navigate('/results')} variant="outline" size="sm">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  {t('dashboard.enterResults')}
                </Button>
              </div>
            ) : (
              <LazyPieChart
                data={gradeDistribution}
                height={300}
                colors={GRADE_COLORS}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Retraining Targets Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('retraining.title')}</CardTitle>
            <CardDescription>{t('dashboard.retrainingList')} {t('dashboard.recent10')}</CardDescription>
          </div>
          {retrainingTargets.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => navigate('/retraining')}>
              {t('common.viewAll')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {retrainingTargets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="rounded-full bg-status-pass/10 p-6 mb-4">
                <ClipboardCheck className="h-12 w-12 text-status-pass" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('dashboard.noRetrainingNeeded')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t('dashboard.allEmployeesCompliant')}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('employee.name')}</TableHead>
                  <TableHead>{t('employee.position')}</TableHead>
                  <TableHead>{t('employee.building')}</TableHead>
                  <TableHead>{t('common.program')}</TableHead>
                  <TableHead>{t('common.failDate')}</TableHead>
                  <TableHead>{t('common.score')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retrainingTargets.slice(0, 10).map((target, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {target.employee.employee_name}
                    </TableCell>
                    <TableCell>{target.employee.position}</TableCell>
                    <TableCell>
                      {t(`building.${target.employee.building}`)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {target.program.program_code}
                      </Badge>
                      <span className="ml-2 text-sm">
                        {target.program.program_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(target.last_result.training_date), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {target.last_result.score ?? 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/employees/${target.employee.employee_id}`)}
                      >
                        {t('common.detail')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {retrainingTargets.slice(0, 10).map((target, index) => (
                  <Card key={index} className="p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-base">{target.employee.employee_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {target.employee.position}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {target.last_result.score ?? 'N/A'}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('employee.building')}:</span>
                        <span className="font-medium">
                          {t(`building.${target.employee.building}`)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t('common.program')}:</span>
                        <div className="flex flex-col items-end">
                          <Badge variant="outline" className="mb-1">
                            {target.program.program_code}
                          </Badge>
                          <span className="text-xs">{target.program.program_name}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('common.failDate')}:</span>
                        <span className="font-medium">
                          {format(new Date(target.last_result.training_date), 'yyyy-MM-dd')}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => navigate(`/employees/${target.employee.employee_id}`)}
                    >
                      {t('common.detail')}
                    </Button>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Expiring Trainings */}
      {expiringTrainings.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-warning/20">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('progress.expiring')}</CardTitle>
                <CardDescription>
                  {t('dashboard.recent10')} - {expiringTrainings.length}건
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/retraining')}>
              {t('common.viewAll')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {expiringTrainings.slice(0, 6).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-background hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => navigate(`/employees/${item.employee.employee_id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.employee.employee_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.program.program_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge
                      variant={item.days_until_expiry <= 7 ? 'destructive' : 'outline'}
                      className={item.days_until_expiry <= 7 ? '' : 'border-warning text-warning'}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      D-{item.days_until_expiry}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
