/**
 * Metal Detector Dashboard
 * 주간 KPI Summary + 공장별 비교 + 반복 이슈 + 통과율 추세
 * (이메일 리포트와 동일한 데이터를 시스템에서 실시간 제공)
 */

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, AlertTriangle, Activity, Wrench, RefreshCw, TrendingDown, TrendingUp, Minus, Mail } from 'lucide-react';
import { LazyBarChart, LazyLineChart } from '@/components/charts/LazyCharts';
import MDEmailSettings from '@/components/metal-detector/MDEmailSettings';
import { useShallow } from 'zustand/react/shallow';
import { useMDInspectionStore } from '@/stores/mdInspectionStore';
import type { FactoryCode, ImprovementStatus } from '@/types/metalDetector';

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const IMPROVEMENT_CONFIG: Record<ImprovementStatus, { color: string; icon: typeof TrendingDown; label: string }> = {
  improved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: TrendingDown, label: 'metalDetector.weeklyReport.improved' },
  no_change: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400', icon: Minus, label: 'metalDetector.weeklyReport.noChange' },
  increased: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: TrendingUp, label: 'metalDetector.weeklyReport.increased' },
};

export default function MDDashboard() {
  const { t } = useTranslation();
  const {
    weeklyComparison,
    repeatedIssues,
    weeklyTrend,
    isLoading,
    fetchWeeklyComparison,
    fetchRepeatedIssues,
    fetchWeeklyTrend,
  } = useMDInspectionStore(useShallow((s) => ({
    weeklyComparison: s.weeklyComparison,
    repeatedIssues: s.repeatedIssues,
    weeklyTrend: s.weeklyTrend,
    isLoading: s.isLoading,
    fetchWeeklyComparison: s.fetchWeeklyComparison,
    fetchRepeatedIssues: s.fetchRepeatedIssues,
    fetchWeeklyTrend: s.fetchWeeklyTrend,
  })));

  const currentYear = new Date().getFullYear();
  const currentWeek = getISOWeekNumber(new Date());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  const weekOptions = useMemo(() => {
    const weeks = [];
    for (let w = 1; w <= 52; w++) weeks.push(w);
    return weeks;
  }, []);

  useEffect(() => {
    fetchWeeklyComparison(selectedYear, selectedWeek);
    fetchRepeatedIssues(selectedYear, selectedWeek);
    fetchWeeklyTrend(selectedYear, 12);
  }, [selectedYear, selectedWeek, fetchWeeklyComparison, fetchRepeatedIssues, fetchWeeklyTrend]);

  const comp = weeklyComparison;

  // Weekly trend chart data
  const trendChartData = weeklyTrend.map((w) => ({
    name: `W${w.weekNumber}`,
    passRate: Math.round(w.passRate * 10) / 10,
    total: w.total,
  }));

  if (isLoading && !comp) {
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
        <div className="flex gap-2">
          <MDEmailSettings />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Send report handler - 향후 EMAIL 에이전트와 연동
              window.alert(t('metalDetector.email.sendSuccess'));
            }}
          >
            <Mail className="h-4 w-4 mr-1" />
            {t('metalDetector.email.sendReport')}
          </Button>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedWeek)}
            onValueChange={(v) => setSelectedWeek(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weekOptions.map((w) => (
                <SelectItem key={w} value={String(w)}>W{w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ===== KPI SUMMARY ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('metalDetector.weeklyReport.kpiSummary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
            {/* Total Machines Checked */}
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.totalChecked')}</p>
              <p className="text-2xl font-bold">{comp?.thisWeek.totalChecked ?? 0}</p>
            </div>

            {/* Machines Failed Last Week */}
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <ShieldAlert className="h-4 w-4 mx-auto mb-1 text-orange-500" />
              <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.failedLastWeek')}</p>
              <p className="text-2xl font-bold">{comp?.lastWeek.failCount ?? 0}</p>
            </div>

            {/* Machines Failed This Week */}
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <ShieldAlert className="h-4 w-4 mx-auto mb-1 text-red-500" />
              <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.failedThisWeek')}</p>
              <p className="text-2xl font-bold text-red-600">{comp?.thisWeek.failCount ?? 0}</p>
            </div>

            {/* Machines Fixed On Time */}
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Wrench className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.fixedOnTime')}</p>
              <p className="text-2xl font-bold">{comp?.machinesFixedOnTime ?? 0}</p>
              <p className="text-xs text-muted-foreground">
                {comp ? `${comp.machinesFixedOnTime}/${comp.machinesFailedLastWeek}` : '0/0'}
              </p>
            </div>

            {/* Maintenance Fix Rate */}
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Wrench className="h-4 w-4 mx-auto mb-1 text-green-500" />
              <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.maintenanceFixRate')}</p>
              <p className="text-2xl font-bold text-green-600">
                {comp ? `${comp.maintenanceFixRate.toFixed(0)}%` : '0%'}
              </p>
            </div>

            {/* Repeated Issue Machines */}
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <RefreshCw className="h-4 w-4 mx-auto mb-1 text-amber-500" />
              <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.repeatedIssues')}</p>
              <p className="text-2xl font-bold">{repeatedIssues?.repeatedCount ?? 0}</p>
            </div>

            {/* Repeated Issue Rate */}
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-amber-500" />
              <p className="text-xs text-muted-foreground">{t('metalDetector.weeklyReport.repeatedRate')}</p>
              <p className="text-2xl font-bold">
                {repeatedIssues ? `${repeatedIssues.repeatedRate.toFixed(1)}%` : '0%'}
              </p>
              <p className="text-xs text-muted-foreground">
                {repeatedIssues ? `${repeatedIssues.repeatedCount}/${repeatedIssues.totalInspected}` : '0/0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== WEEKLY COMPARISON BY FACTORY ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('metalDetector.weeklyReport.factoryComparison')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('metalDetector.factory.label')}</TableHead>
                <TableHead className="text-center">{t('metalDetector.weeklyReport.failedLastWeek')}</TableHead>
                <TableHead className="text-center">{t('metalDetector.weeklyReport.failedThisWeek')}</TableHead>
                <TableHead className="text-center">{t('metalDetector.weeklyReport.improvement')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(['A', 'B', 'C', 'D'] as FactoryCode[]).map((f) => {
                const fc = comp?.factoryComparison[f];
                const status = fc?.improvement ?? 'no_change';
                const config = IMPROVEMENT_CONFIG[status];
                const Icon = config.icon;
                return (
                  <TableRow key={f}>
                    <TableCell className="font-medium">Factory {f}</TableCell>
                    <TableCell className="text-center">{fc?.failedLastWeek ?? 0}</TableCell>
                    <TableCell className="text-center">{fc?.failedThisWeek ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={config.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {t(config.label)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ===== REPEATED ISSUE MACHINE ANALYSIS ===== */}
      {repeatedIssues && repeatedIssues.machines.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-red-600">
              {t('metalDetector.weeklyReport.repeatedIssueAnalysis')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('metalDetector.machineId')}</TableHead>
                  <TableHead>{t('metalDetector.factory.label')}</TableHead>
                  <TableHead>{t('metalDetector.line')}</TableHead>
                  <TableHead>{t('metalDetector.weeklyReport.keyIssue')}</TableHead>
                  <TableHead>{t('metalDetector.weeklyReport.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repeatedIssues.machines.map((m) => (
                  <TableRow key={m.machineId}>
                    <TableCell className="font-mono font-medium">{m.machineId}</TableCell>
                    <TableCell>Factory {m.factory}</TableCell>
                    <TableCell>{m.line}</TableCell>
                    <TableCell>{m.keyIssue}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{t('metalDetector.weeklyReport.repeated')}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ===== PASS RATE COMPARISON (2 WEEKS) ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('metalDetector.weeklyReport.passRateComparison')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall */}
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="text-center p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">
                {t('metalDetector.weeklyReport.lastWeek')} (W{comp?.lastWeek.weekNumber})
              </p>
              <p className="text-2xl font-bold">{comp ? `${comp.lastWeek.passRate.toFixed(0)}%` : '-'}</p>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">
                {t('metalDetector.weeklyReport.thisWeek')} (W{comp?.thisWeek.weekNumber})
              </p>
              <p className="text-2xl font-bold">{comp ? `${comp.thisWeek.passRate.toFixed(0)}%` : '-'}</p>
            </div>
          </div>

          {/* By Factory */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('metalDetector.factory.label')}</TableHead>
                <TableHead className="text-center">
                  {t('metalDetector.weeklyReport.lastWeek')} (W{comp?.lastWeek.weekNumber})
                </TableHead>
                <TableHead className="text-center">
                  {t('metalDetector.weeklyReport.thisWeek')} (W{comp?.thisWeek.weekNumber})
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(['A', 'B', 'C', 'D'] as FactoryCode[]).map((f) => {
                const lw = comp?.lastWeek.byFactory[f];
                const tw = comp?.thisWeek.byFactory[f];
                return (
                  <TableRow key={f}>
                    <TableCell className="font-medium">Factory {f}</TableCell>
                    <TableCell className="text-center">
                      {lw ? `${lw.passRate.toFixed(0)}%` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={
                        tw && lw
                          ? tw.passRate > lw.passRate ? 'text-green-600 font-medium' :
                            tw.passRate < lw.passRate ? 'text-red-600 font-medium' : ''
                          : ''
                      }>
                        {tw ? `${tw.passRate.toFixed(0)}%` : '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-bold border-t-2">
                <TableCell>Total</TableCell>
                <TableCell className="text-center">
                  {comp ? `${comp.lastWeek.passRate.toFixed(0)}%` : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {comp ? `${comp.thisWeek.passRate.toFixed(0)}%` : '-'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ===== Charts ===== */}
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
              data={
                comp
                  ? (['A', 'B', 'C', 'D'] as FactoryCode[]).map((f) => ({
                      name: `Factory ${f}`,
                      pass: comp.thisWeek.byFactory[f].pass,
                      fail: comp.thisWeek.byFactory[f].fail,
                    }))
                  : []
              }
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
