import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Clock,
  AlertTriangle,
  Search,
  UserCheck,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInspectionStore } from '@/stores/inspectionStore';
import { LazyBarChart } from '@/components/charts/LazyCharts';
import { InspectionStrikeIndicator } from '@/components/inspection/InspectionStrikeIndicator';

export default function InspectionDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    results,
    enrollments,
    isLoadingResults,
    isLoadingEnrollments,
    error,
    fetchResults,
    fetchEnrollments,
    clearError,
  } = useInspectionStore();

  useEffect(() => {
    fetchResults();
    fetchEnrollments();
  }, [fetchResults, fetchEnrollments]);

  const totalInspections = results.length;
  const passCount = results.filter((r) => r.match_rate >= 80).length;
  const passRate = totalInspections > 0 ? Math.round((passCount / totalInspections) * 100) : 0;
  const pendingEnrollments = enrollments.filter((e) => e.status === 'PENDING' || e.status === 'SCHEDULED').length;

  // Identify employees with consecutive failures (crude check from results)
  const employeeFailStreaks = new Map<string, number>();
  const sortedByEmployee = [...results].sort((a, b) => {
    if (a.employee_id !== b.employee_id) return a.employee_id.localeCompare(b.employee_id);
    return b.training_date.localeCompare(a.training_date);
  });

  let currentEmployee = '';
  let streak = 0;
  for (const r of sortedByEmployee) {
    if (r.employee_id !== currentEmployee) {
      if (currentEmployee && streak > 0) employeeFailStreaks.set(currentEmployee, streak);
      currentEmployee = r.employee_id;
      streak = 0;
    }
    if (r.match_rate < 80) {
      streak++;
    } else {
      if (streak > 0) employeeFailStreaks.set(currentEmployee, streak);
      streak = 0;
      currentEmployee = r.employee_id;
    }
  }
  if (currentEmployee && streak > 0) employeeFailStreaks.set(currentEmployee, streak);

  const strikeAlerts = Array.from(employeeFailStreaks.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const monthMap = new Map<string, { total: number; pass: number }>();
    for (const r of results) {
      const month = r.training_date.slice(0, 7); // YYYY-MM
      const existing = monthMap.get(month) || { total: 0, pass: 0 };
      existing.total++;
      if (r.match_rate >= 80) existing.pass++;
      monthMap.set(month, existing);
    }
    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6) // Last 6 months
      .map(([month, data]) => ({
        name: month,
        total: data.total,
        pass: data.pass,
        fail: data.total - data.pass,
      }));
  }, [results]);

  const isLoading = isLoadingResults || isLoadingEnrollments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6" />
            {t('inspection.dashboard.title')}
          </h1>
        </div>
        <Button onClick={() => navigate('/inspection/result')}>
          <ClipboardCheck className="h-4 w-4 mr-2" />
          {t('inspection.result.title')}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError}>
              {t('common.dismiss')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('inspection.dashboard.totalInspections')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalInspections}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('inspection.dashboard.passRate')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{passRate}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('inspection.dashboard.pendingEnrollments')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-blue-600">{pendingEnrollments}</div>
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('inspection.dashboard.strikeAlerts')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-red-600">{strikeAlerts.length}</div>
                  {strikeAlerts.length > 0 && <AlertTriangle className="h-5 w-5 text-red-400" />}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Results + Strike Warnings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Results */}
            <Card>
              <CardHeader>
                <CardTitle>{t('inspection.dashboard.recentResults')}</CardTitle>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <ClipboardCheck className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                    <p className="text-muted-foreground">
                      {t('inspection.dashboard.noResults')}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/inspection/result')}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('inspection.dashboard.startInspection')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.slice(0, 10).map((r) => (
                      <div
                        key={r.inspection_id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/inspection/history?employee=${r.employee_id}`)}
                      >
                        <div>
                          <p className="font-medium">{r.employee_id}</p>
                          <p className="text-xs text-muted-foreground">{r.training_date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{r.match_rate}%</span>
                          <Badge variant={r.match_rate >= 80 ? 'default' : 'destructive'}>
                            {r.match_rate >= 80 ? t('inspection.common.pass') : t('inspection.common.fail')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Strike Warnings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  {t('inspection.dashboard.strikeWarnings')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {strikeAlerts.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                    <p className="text-muted-foreground">
                      {t('inspection.dashboard.noStrikes')}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/inspection/enrollments')}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      {t('inspection.dashboard.manageEnrollments')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {strikeAlerts.map(([employeeId, failCount]) => (
                      <div
                        key={employeeId}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <p className="font-medium">{employeeId}</p>
                        <InspectionStrikeIndicator consecutiveFailures={failCount} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend Chart */}
          {monthlyTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('inspection.dashboard.monthlyTrend')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LazyBarChart
                  data={monthlyTrend}
                  height={280}
                  bars={[
                    { dataKey: 'pass', name: t('inspection.common.pass'), fill: '#22c55e', stackId: 'a', radius: [0, 0, 0, 0] },
                    { dataKey: 'fail', name: t('inspection.common.fail'), fill: '#ef4444', stackId: 'a', radius: [4, 4, 0, 0] },
                  ]}
                  xAxisKey="name"
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
