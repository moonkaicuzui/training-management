import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Plus,
  ClipboardCheck,
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTrainingStore } from '@/stores/trainingStore';
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
    dashboardStats,
    monthlyData,
    gradeDistribution,
    retrainingTargets,
    loading,
    fetchDashboardStats,
    fetchMonthlyData,
    fetchGradeDistribution,
    fetchRetrainingTargets,
  } = useTrainingStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchMonthlyData();
    fetchGradeDistribution();
    fetchRetrainingTargets();
  }, []);

  if (loading.dashboard) {
    return <PageLoading />;
  }

  const stats = [
    {
      title: t('dashboard.totalEmployees'),
      value: dashboardStats?.totalEmployees ?? 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: t('dashboard.monthlyCompletions'),
      value: dashboardStats?.monthlyCompletions ?? 0,
      icon: GraduationCap,
      color: 'text-status-pass',
      bgColor: 'bg-status-pass/10',
    },
    {
      title: t('dashboard.completionRate'),
      value: `${dashboardStats?.overallCompletionRate ?? 0}%`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: t('dashboard.retrainingNeeded'),
      value: dashboardStats?.retrainingCount ?? 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            Q-TRAIN 교육 관리 시스템에 오신 것을 환영합니다
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
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
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
            <CardDescription>계획 대비 완료 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) => value.substring(5)}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="planned" name="계획" fill="#93C5FD" />
                  <Bar dataKey="completed" name="완료" fill="#1E40AF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.gradeDistribution')}</CardTitle>
            <CardDescription>교육 결과 등급 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ payload, percent }) =>
                      percent && percent > 0 ? `${payload?.grade} (${Math.round(percent * 100)}%)` : ''
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="grade"
                  >
                    {gradeDistribution.map((entry) => (
                      <Cell
                        key={entry.grade}
                        fill={GRADE_COLORS[entry.grade]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retraining Targets Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('retraining.title')}</CardTitle>
            <CardDescription>재교육이 필요한 직원 목록 (최근 10명)</CardDescription>
          </div>
          {retrainingTargets.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => navigate('/retraining')}>
              전체 보기
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {retrainingTargets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              재교육이 필요한 직원이 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('employee.name')}</TableHead>
                  <TableHead>{t('employee.position')}</TableHead>
                  <TableHead>{t('employee.building')}</TableHead>
                  <TableHead>프로그램</TableHead>
                  <TableHead>불합격일</TableHead>
                  <TableHead>점수</TableHead>
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
                      {target.employee.building.replace('BUILDING_', '').replace('_', ' ')}
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
                      {format(new Date(target.lastResult.training_date), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {target.lastResult.score ?? 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/employees/${target.employee.employee_id}`)}
                      >
                        상세
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
