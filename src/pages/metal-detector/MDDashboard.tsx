/**
 * Metal Detector Dashboard
 * 주간 KPI Summary + 공장별 비교 + 반복 이슈 + 통과율 추세
 */

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Mail } from 'lucide-react';
import { LazyBarChart, LazyLineChart } from '@/components/charts/LazyCharts';
import MDEmailSettings from '@/components/metal-detector/MDEmailSettings';
import MDKPICards from '@/components/metal-detector/MDKPICards';
import MDFactoryComparison from '@/components/metal-detector/MDFactoryComparison';
import MDInspectorPerformance from '@/components/metal-detector/MDInspectorPerformance';
import { useShallow } from 'zustand/react/shallow';
import { useMDInspectionStore } from '@/stores/mdInspectionStore';
import { useUIStore } from '@/stores/uiStore';
import { getCurrentHRSummary } from '@/services/api';
import type { HRSummary } from '@/services/api';
import { logger } from '@/utils/logger';

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function MDDashboard() {
  const { t } = useTranslation();
  const addToast = useUIStore((s) => s.addToast);
  const {
    weeklyComparison, repeatedIssues, weeklyTrend, inspections, isLoading,
    fetchWeeklyComparison, fetchRepeatedIssues, fetchWeeklyTrend, fetchInspections,
  } = useMDInspectionStore(useShallow((s) => ({
    weeklyComparison: s.weeklyComparison,
    repeatedIssues: s.repeatedIssues,
    weeklyTrend: s.weeklyTrend,
    inspections: s.inspections,
    isLoading: s.isLoading,
    fetchWeeklyComparison: s.fetchWeeklyComparison,
    fetchRepeatedIssues: s.fetchRepeatedIssues,
    fetchWeeklyTrend: s.fetchWeeklyTrend,
    fetchInspections: s.fetchInspections,
  })));

  const currentYear = new Date().getFullYear();
  const currentWeek = getISOWeekNumber(new Date());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  const [hrData, setHrData] = useState<HRSummary | null>(null);
  useEffect(() => {
    getCurrentHRSummary()
      .then(setHrData)
      .catch((err) => logger.warn('[MDDashboard] HR 데이터 로드 실패:', err));
  }, []);

  const weekOptions = useMemo(() => {
    const weeks = [];
    for (let w = 1; w <= 52; w++) weeks.push(w);
    return weeks;
  }, []);

  useEffect(() => {
    fetchWeeklyComparison(selectedYear, selectedWeek);
    fetchRepeatedIssues(selectedYear, selectedWeek);
    fetchWeeklyTrend(selectedYear, 12);
    fetchInspections({ year: selectedYear, weekNumber: selectedWeek });
  }, [selectedYear, selectedWeek, fetchWeeklyComparison, fetchRepeatedIssues, fetchWeeklyTrend, fetchInspections]);

  const comp = weeklyComparison;

  const inspectorStats = useMemo(() => {
    const weekInspections = inspections.filter(
      (i) => i.year === selectedYear && i.weekNumber === selectedWeek
    );
    const statsMap = new Map<string, { inspectorId: string; inspectorName: string; total: number; pass: number; fail: number; passRate: number }>();
    weekInspections.forEach((i) => {
      const key = i.inspectorId || i.inspectorName || 'unknown';
      const existing = statsMap.get(key) || { inspectorId: i.inspectorId || '-', inspectorName: i.inspectorName || '-', total: 0, pass: 0, fail: 0, passRate: 0 };
      existing.total++;
      if (i.result === 'PASS') existing.pass++;
      else existing.fail++;
      existing.passRate = existing.total > 0 ? (existing.pass / existing.total) * 100 : 0;
      statsMap.set(key, existing);
    });
    return Array.from(statsMap.values()).sort((a, b) => b.total - a.total);
  }, [inspections, selectedYear, selectedWeek]);

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
          <h1 className="text-2xl font-bold tracking-tight">{t('metalDetector.dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('metalDetector.dashboard.description')}</p>
        </div>
        <div className="flex gap-2">
          <MDEmailSettings />
          <Button variant="outline" size="sm" onClick={() => addToast({ type: 'success', title: t('metalDetector.email.sendSuccess') })}>
            <Mail className="h-4 w-4 mr-1" />
            {t('metalDetector.email.sendReport')}
          </Button>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedWeek)} onValueChange={(v) => setSelectedWeek(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {weekOptions.map((w) => (
                <SelectItem key={w} value={String(w)}>W{w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <MDKPICards comp={comp} repeatedIssues={repeatedIssues} hrData={hrData} />

      <MDFactoryComparison comp={comp} />

      {/* Repeated Issue Machines */}
      {repeatedIssues && repeatedIssues.machines.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-red-600">{t('metalDetector.weeklyReport.repeatedIssueAnalysis')}</CardTitle>
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
                    <TableCell><Badge variant="destructive">{t('metalDetector.weeklyReport.repeated')}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <MDInspectorPerformance stats={inspectorStats} />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('metalDetector.dashboard.factoryChart')}</CardTitle></CardHeader>
          <CardContent>
            <LazyBarChart
              data={comp ? Object.entries(comp.thisWeek.byFactory).map(([f, stats]) => ({ name: f, pass: stats.pass, fail: stats.fail })) : []}
              height={300}
              bars={[
                { dataKey: 'pass', name: t('metalDetector.result.pass'), fill: '#22c55e', stackId: 'a' },
                { dataKey: 'fail', name: t('metalDetector.result.fail'), fill: '#ef4444', stackId: 'a' },
              ]}
              xAxisKey="name"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t('metalDetector.dashboard.weeklyTrend')}</CardTitle></CardHeader>
          <CardContent>
            <LazyLineChart
              data={trendChartData}
              height={300}
              lines={[{ dataKey: 'passRate', name: t('metalDetector.dashboard.passRate'), stroke: '#3b82f6', strokeWidth: 2 }]}
              xAxisKey="name"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
