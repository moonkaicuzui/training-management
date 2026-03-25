/**
 * Executive Dashboard Page
 * 경영진 대시보드 - 핵심 KPI 및 본사 보고용 리포트 (Orchestrator)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Calendar,
  Download,
  Building2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExecutiveKPI, BenchmarkMetric } from '@/types/executive';
import type {
  Employee,
  TrainingProgram,
  TrainingResultRecord,
  MonthlyTrainingData,
  NewTQCDashboardStats,
} from '@/types';
import * as api from '@/services/api';
import {
  calculateDashboardKPIs,
  calculateEmployeeCompletionStatus,
} from '@/utils/kpiCalculator';
import type { KPICalculationResult } from '@/utils/kpiCalculator';
import type { TrainingCost } from '@/services/roiService';

// Sub-components
import { KPICard } from '@/components/executive/ExecutiveKPICards';
import { OverviewTab, TrainingStatusTab, ROIAnalysisTab, BenchmarkTab } from '@/components/executive/ExecutiveCharts';
import { ReportTab } from '@/components/executive/ExecutiveDetails';

// ========== Helper: Determine KPI status ==========

function getKPIStatus(
  value: number,
  target: number,
  inverseTrend?: boolean
): ExecutiveKPI['status'] {
  const ratio = inverseTrend ? target / value : value / target;
  if (ratio >= 1) return 'achieved';
  if (ratio >= 0.9) return 'on-track';
  if (ratio >= 0.8) return 'at-risk';
  return 'missed';
}

// ========== Main Component ==========

export default function ExecutiveDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState<'month' | 'quarter' | 'half' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw data from API
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [results, setResults] = useState<TrainingResultRecord[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrainingData[]>([]);
  const [tqcStats, setTqcStats] = useState<NewTQCDashboardStats | null>(null);
  const [trainingCosts, setTrainingCosts] = useState<TrainingCost[]>([]);
  const [costFormOpen, setCostFormOpen] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [emps, progs, res, monthly, tqc, costs] = await Promise.all([
          api.getEmployees(),
          api.getPrograms(),
          api.getResults(),
          api.getMonthlyTrainingData(),
          api.getNewTQCDashboardStats(),
          api.getTrainingCosts(),
        ]);
        setEmployees(emps);
        setPrograms(progs);
        setResults(res);
        setMonthlyData(monthly);
        setTqcStats(tqc);
        setTrainingCosts(costs);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter results by period
  const filteredResults = useMemo(() => {
    if (period === 'all') return results;
    const now = new Date();
    let cutoff: Date;
    switch (period) {
      case 'month':
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case 'half':
        cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      default:
        return results;
    }
    return results.filter(r => new Date(r.training_date) >= cutoff);
  }, [results, period]);

  // Compute KPIs from real data
  const kpiResult = useMemo<KPICalculationResult | null>(() => {
    if (employees.length === 0 && programs.length === 0) return null;
    return calculateDashboardKPIs(employees, programs, filteredResults);
  }, [employees, programs, filteredResults]);

  // Compute qualification rate (employees with 100% completion)
  const qualificationRate = useMemo(() => {
    if (!kpiResult || employees.length === 0) return 0;
    const activeEmployees = employees.filter(e => e.status === 'ACTIVE');
    if (activeEmployees.length === 0) return 0;

    let qualifiedCount = 0;
    for (const emp of activeEmployees) {
      const status = calculateEmployeeCompletionStatus(emp, programs, filteredResults);
      if (status.completion_rate === 100) qualifiedCount++;
    }
    return Math.round((qualifiedCount / activeEmployees.length) * 100);
  }, [kpiResult, employees, programs, filteredResults]);

  // Build executive KPIs array
  const executiveKPIs = useMemo<ExecutiveKPI[]>(() => {
    if (!kpiResult) return [];
    const completionRate = kpiResult.overallCompletionRate;
    const resignationRate = tqcStats?.resignationRate ?? 0;
    const passRate = kpiResult.passRate;

    return [
      {
        id: 'completion-rate',
        title: t('executive.kpiCompletionRate'),
        value: completionRate,
        target: 95,
        unit: '%',
        trend: 0,
        status: getKPIStatus(completionRate, 95),
      },
      {
        id: 'qualification-rate',
        title: t('executive.kpiQualificationRate'),
        value: qualificationRate,
        target: 90,
        unit: '%',
        trend: 0,
        status: getKPIStatus(qualificationRate, 90),
      },
      {
        id: 'turnover-rate',
        title: t('executive.kpiTurnoverRate'),
        value: resignationRate,
        target: 5,
        unit: '%',
        trend: 0,
        status: getKPIStatus(resignationRate, 5, true),
        inverseTrend: true,
      },
      {
        id: 'roi',
        title: t('executive.hqPassRate'),
        value: passRate,
        target: 80,
        unit: '%',
        trend: 0,
        status: getKPIStatus(passRate, 80),
      },
    ];
  }, [t, kpiResult, qualificationRate, tqcStats]);

  // Build benchmark data with real current values
  const benchmarkData = useMemo<BenchmarkMetric[]>(() => {
    if (!kpiResult) return [];
    const resignationRate = tqcStats?.resignationRate ?? 0;

    return [
      {
        metric: 'training-completion',
        metricKr: t('executive.kpiCompletionRate'),
        current: kpiResult.overallCompletionRate,
        target: 95,
        industryAvg: 85,
        hwkGroupAvg: 90,
        unit: '%',
      },
      {
        metric: 'first-pass-rate',
        metricKr: t('executive.firstTimePassRate'),
        current: kpiResult.firstTimePassRate,
        target: 80,
        industryAvg: 70,
        hwkGroupAvg: 75,
        unit: '%',
      },
      {
        metric: 'turnover-rate',
        metricKr: t('executive.kpiTurnoverRate'),
        current: resignationRate,
        target: 5,
        industryAvg: 8,
        hwkGroupAvg: 6,
        unit: '%',
        lowerIsBetter: true,
      },
      {
        metric: 'pass-rate',
        metricKr: t('executive.passRateLabel'),
        current: kpiResult.passRate,
        target: 80,
        industryAvg: 70,
        hwkGroupAvg: 75,
        unit: '%',
      },
    ];
  }, [t, kpiResult, tqcStats]);

  // Build monthly chart data
  const monthlyChartData = useMemo(() => {
    return monthlyData.map(d => {
      const monthDate = new Date(d.month + '-01');
      return {
        period: monthDate.toLocaleDateString(undefined, { month: 'short' }) || d.month,
        planned: d.planned,
        completed: d.completed,
        completionRate: d.planned > 0 ? Math.round((d.completed / d.planned) * 100) : 0,
      };
    });
  }, [monthlyData]);

  // Refresh training costs after save
  const handleCostSaved = useCallback(async () => {
    try {
      const costs = await api.getTrainingCosts();
      setTrainingCosts(costs);
    } catch {
      // Error handled in service layer
    }
  }, []);

  // Excel 다운로드 핸들러
  const handleExportExcel = useCallback(async () => {
    const XLSX = await import('xlsx');

    const wb = XLSX.utils.book_new();

    // 요약 시트
    const now = new Date();
    const periodStr = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    const summaryData = [
      [t('executive.exportReportTitle')],
      [''],
      [t('executive.exportPeriod'), periodStr],
      [t('executive.exportTotalEmployees'), kpiResult?.totalEmployees ?? 0],
      [t('executive.exportCompletionRate'), `${kpiResult?.overallCompletionRate ?? 0}%`],
      [t('executive.exportPassRate'), `${kpiResult?.passRate ?? 0}%`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, t('executive.exportSheetSummary'));

    // KPI 시트
    const kpiHeader = [t('executive.exportKPIName'), t('executive.exportActual'), t('executive.exportTarget'), t('executive.exportAchievementRate'), t('executive.exportStatus')];
    const kpiRows = executiveKPIs.map((kpi) => [
      kpi.title,
      `${kpi.value}${kpi.unit}`,
      `${kpi.target}${kpi.unit}`,
      `${((kpi.value / kpi.target) * 100).toFixed(1)}%`,
      kpi.status === 'achieved'
        ? t('executive.hqStatusAchieved')
        : kpi.status === 'on-track'
          ? t('executive.hqStatusInProgress')
          : t('executive.hqStatusBelow'),
    ]);
    const wsKPI = XLSX.utils.aoa_to_sheet([kpiHeader, ...kpiRows]);
    XLSX.utils.book_append_sheet(wb, wsKPI, t('executive.exportSheetKPI'));

    // 월별 현황 시트
    if (monthlyChartData.length > 0) {
      const monthlyHeader = [t('executive.exportMonthlyPeriod'), t('executive.exportMonthlyPlanned'), t('executive.exportMonthlyCompleted'), t('executive.exportMonthlyRate')];
      const monthlyRows = monthlyChartData.map(d => [
        d.period,
        d.planned,
        d.completed,
        `${d.completionRate}%`,
      ]);
      const wsMonthly = XLSX.utils.aoa_to_sheet([monthlyHeader, ...monthlyRows]);
      XLSX.utils.book_append_sheet(wb, wsMonthly, t('executive.exportMonthlySheet'));
    }

    const filename = `${t('executive.exportFilename')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, [kpiResult, executiveKPIs, monthlyChartData]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('executive.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {t('executive.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('executive.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">{t('executive.periodMonth')}</SelectItem>
              <SelectItem value="quarter">{t('executive.periodQuarter')}</SelectItem>
              <SelectItem value="half">{t('executive.periodHalf')}</SelectItem>
              <SelectItem value="all">{t('executive.periodAll')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            {t('executive.hqReport')}
          </Button>
        </div>
      </div>

      {/* 핵심 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {executiveKPIs.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{t('executive.tabOverview')}</TabsTrigger>
          <TabsTrigger value="roi">{t('executive.tabTraining')}</TabsTrigger>
          <TabsTrigger value="roi-analysis">{t('executive.roi')}</TabsTrigger>
          <TabsTrigger value="benchmark">{t('executive.tabBenchmark')}</TabsTrigger>
          <TabsTrigger value="report">{t('executive.tabHQReport')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab monthlyChartData={monthlyChartData} tqcStats={tqcStats} />
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <TrainingStatusTab kpiResult={kpiResult} monthlyChartData={monthlyChartData} />
        </TabsContent>

        <TabsContent value="roi-analysis" className="space-y-6">
          <ROIAnalysisTab
            employees={employees}
            programs={programs}
            filteredResults={filteredResults}
            trainingCosts={trainingCosts}
            loading={loading}
            costFormOpen={costFormOpen}
            setCostFormOpen={setCostFormOpen}
            onCostSaved={handleCostSaved}
          />
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-6">
          <BenchmarkTab benchmarkData={benchmarkData} />
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <ReportTab
            executiveKPIs={executiveKPIs}
            totalEmployees={kpiResult?.totalEmployees ?? 0}
            completionRate={kpiResult?.overallCompletionRate ?? 0}
            passRate={kpiResult?.passRate ?? 0}
            onExportExcel={handleExportExcel}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
