/**
 * Metal Detector Dashboard
 * KPI Cards + Factory Bar Chart + Weekly Trend Line Chart
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, ShieldAlert, AlertTriangle, Activity } from 'lucide-react';
import { LazyBarChart, LazyLineChart } from '@/components/charts/LazyCharts';
import { useMDInspectionStore } from '@/stores/mdInspectionStore';
import type { FactoryCode } from '@/types/metalDetector';

export default function MDDashboard() {
  const { t } = useTranslation();
  const { dashboardKPIs, weeklyTrend, isLoading, fetchDashboardKPIs, fetchWeeklyTrend } =
    useMDInspectionStore();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    fetchDashboardKPIs(selectedYear);
    fetchWeeklyTrend(selectedYear, 12);
  }, [selectedYear, fetchDashboardKPIs, fetchWeeklyTrend]);

  // Factory chart data
  const factoryChartData = dashboardKPIs
    ? (['A', 'B', 'C', 'D'] as FactoryCode[]).map((f) => ({
        name: `Factory ${f}`,
        pass: dashboardKPIs.byFactory[f].pass,
        fail: dashboardKPIs.byFactory[f].fail,
      }))
    : [];

  // Weekly trend chart data
  const trendChartData = weeklyTrend.map((w) => ({
    name: `W${w.weekNumber}`,
    passRate: Math.round(w.passRate * 10) / 10,
    total: w.total,
  }));

  if (isLoading && !dashboardKPIs) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('metalDetector.dashboard.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('metalDetector.dashboard.description')}
          </p>
        </div>
        <Select
          value={String(selectedYear)}
          onValueChange={(v) => setSelectedYear(Number(v))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('metalDetector.dashboard.totalInspections')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardKPIs?.totalInspections ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('metalDetector.dashboard.passRate')}
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardKPIs ? `${dashboardKPIs.passRate.toFixed(1)}%` : '0%'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('metalDetector.dashboard.failCount')}
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardKPIs?.failCount ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('metalDetector.dashboard.openCAs')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {dashboardKPIs?.openCAs ?? 0}
              </span>
              {(dashboardKPIs?.overdueCAs ?? 0) > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {dashboardKPIs!.overdueCAs} {t('metalDetector.ca.status.overdue')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Factory Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('metalDetector.dashboard.factoryChart')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LazyBarChart
              data={factoryChartData}
              height={300}
              bars={[
                { dataKey: 'pass', name: t('metalDetector.result.pass'), fill: '#22c55e', stackId: 'a' },
                { dataKey: 'fail', name: t('metalDetector.result.fail'), fill: '#ef4444', stackId: 'a' },
              ]}
              xAxisKey="name"
            />
          </CardContent>
        </Card>

        {/* Weekly Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('metalDetector.dashboard.weeklyTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LazyLineChart
              data={trendChartData}
              height={300}
              lines={[
                {
                  dataKey: 'passRate',
                  name: t('metalDetector.dashboard.passRate'),
                  stroke: '#3b82f6',
                  strokeWidth: 2,
                },
              ]}
              xAxisKey="name"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
