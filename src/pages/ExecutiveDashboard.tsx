/**
 * Executive Dashboard Page
 * 경영진 대시보드 - 핵심 KPI 및 본사 보고용 리포트
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Users,
  Award,
  AlertTriangle,
  Calendar,
  Download,
  FileText,
  Building2,
  GraduationCap,
  UserMinus,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LazyBarChart,
  LazyLineChart,
} from '@/components/charts/LazyCharts';
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

// ========== Sub Components ==========

// KPI 카드 컴포넌트
const KPICard = memo(function KPICard({ kpi }: { kpi: ExecutiveKPI }) {
  const { t } = useTranslation();
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'completion-rate': Award,
    'qualification-rate': Users,
    'turnover-rate': UserMinus,
    'roi': DollarSign,
  };
  const Icon = iconMap[kpi.id] || Target;

  const colorMap: Record<string, string> = {
    'completion-rate': 'text-green-600',
    'qualification-rate': 'text-blue-600',
    'turnover-rate': 'text-orange-600',
    'roi': 'text-purple-600',
  };
  const color = colorMap[kpi.id] || 'text-primary';

  const achievementRate = Math.min(100, (kpi.value / kpi.target) * 100);

  const getTrendBadge = () => {
    const isPositive = kpi.inverseTrend ? kpi.trend < 0 : kpi.trend > 0;
    return (
      <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
        {kpi.trend > 0 ? '↑' : '↓'} {Math.abs(kpi.trend)}%
      </Badge>
    );
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {kpi.value}
          {kpi.unit}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {t('executive.kpiTarget', { target: kpi.target, unit: kpi.unit })}
          </span>
          {getTrendBadge()}
        </div>
        <Progress value={achievementRate} className="mt-2 h-2" />
      </CardContent>
    </Card>
  );
});

// 벤치마크 비교 항목 컴포넌트
const BenchmarkItem = memo(function BenchmarkItem({
  metric,
}: {
  metric: BenchmarkMetric;
}) {
  const { t } = useTranslation();
  const achievementRate = Math.min(100, (metric.current / metric.target) * 100);
  const vsIndustry = metric.lowerIsBetter
    ? metric.industryAvg - metric.current
    : metric.current - metric.industryAvg;
  const vsGroup = metric.lowerIsBetter
    ? metric.hwkGroupAvg - metric.current
    : metric.current - metric.hwkGroupAvg;

  const status =
    achievementRate >= 100 ? 'achieved' : achievementRate >= 80 ? 'on-track' : 'below';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium">{metric.metricKr}</span>
          <Badge
            variant={
              status === 'achieved'
                ? 'default'
                : status === 'on-track'
                  ? 'secondary'
                  : 'destructive'
            }
          >
            {status === 'achieved' ? t('executive.benchStatusAchieved') : status === 'on-track' ? t('executive.benchStatusInProgress') : t('executive.benchStatusBelow')}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {t('executive.kpiTarget', { target: metric.target, unit: metric.unit })}
          </span>
          <span className="font-bold text-lg">
            {metric.current}
            {metric.unit}
          </span>
        </div>
      </div>

      <Progress value={achievementRate} className="h-3" />

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          {vsIndustry >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className="text-muted-foreground">{t('executive.benchVsIndustry')}</span>
          <span className={vsIndustry >= 0 ? 'text-green-600' : 'text-red-600'}>
            {vsIndustry >= 0 ? '+' : ''}
            {vsIndustry.toFixed(1)}
            {metric.unit}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {vsGroup >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className="text-muted-foreground">{t('executive.benchVsGroup')}</span>
          <span className={vsGroup >= 0 ? 'text-green-600' : 'text-red-600'}>
            {vsGroup >= 0 ? '+' : ''}
            {vsGroup.toFixed(1)}
            {metric.unit}
          </span>
        </div>
      </div>
    </div>
  );
});

// 본사 리포트 미리보기 컴포넌트
interface HQReportPreviewProps {
  kpis: ExecutiveKPI[];
  totalEmployees: number;
  completionRate: number;
  trendVsLast: number;
  roi: number;
}

const HQReportPreview = memo(function HQReportPreview({
  kpis,
  totalEmployees,
  completionRate,
  trendVsLast,
  roi,
}: HQReportPreviewProps) {
  const { t } = useTranslation();
  const now = new Date();
  const periodStr = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

  const achievements = kpis
    .filter(k => k.status === 'achieved')
    .map(k => `${k.title} ${t('executive.hqTargetAchieved')} (${k.value}${k.unit} vs ${t('executive.hqKPITarget')} ${k.target}${k.unit})`);

  const riskItems = kpis
    .filter(k => k.status === 'at-risk' || k.status === 'missed')
    .map(k => ({
      severity: (k.status === 'missed' ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
      description: `${k.title} ${k.value}${k.unit} (${t('executive.hqKPITarget')}: ${k.target}${k.unit})`,
      action: t('executive.hqAssignAndImprove'),
    }));

  if (riskItems.length === 0) {
    // Add default if no risk items
    const belowTarget = kpis.filter(k => k.status === 'on-track' && k.value < k.target);
    if (belowTarget.length > 0) {
      riskItems.push({
        severity: 'LOW',
        description: `${belowTarget[0].title} ${t('executive.hqTargetBelow')} (${belowTarget[0].value}${belowTarget[0].unit})`,
        action: t('executive.hqMonitorAndImprove'),
      });
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'achieved':
        return <Badge className="bg-green-500">{t('executive.hqStatusAchieved')}</Badge>;
      case 'on-track':
        return <Badge className="bg-blue-500">{t('executive.hqStatusInProgress')}</Badge>;
      case 'at-risk':
        return <Badge className="bg-yellow-500">{t('executive.hqStatusWarning')}</Badge>;
      default:
        return <Badge className="bg-red-500">{t('executive.hqStatusBelow')}</Badge>;
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-muted/50">
        <div className="text-center">
          <h2 className="text-xl font-bold">HWK Vietnam</h2>
          <h3 className="text-lg font-semibold text-muted-foreground">
            {t('executive.hqPreviewTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {t('executive.hqPreviewPeriod')} {periodStr}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Executive Summary */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Executive Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{totalEmployees}</p>
              <p className="text-xs text-muted-foreground">{t('executive.hqTotalEmployees')}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">{t('executive.hqCompletionRate')}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                {trendVsLast > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                {Math.abs(trendVsLast)}%
              </p>
              <p className="text-xs text-muted-foreground">{t('executive.hqVsLastMonth')}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{roi}%</p>
              <p className="text-xs text-muted-foreground">{t('executive.hqPassRate')}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* KPI 현황 */}
        <div>
          <h4 className="font-semibold mb-3">{t('executive.hqKPITitle')}</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">{t('executive.hqKPIName')}</th>
                <th className="text-right py-2">{t('executive.hqKPIActual')}</th>
                <th className="text-right py-2">{t('executive.hqKPITarget')}</th>
                <th className="text-right py-2">{t('executive.hqKPIVsLastMonth')}</th>
                <th className="text-center py-2">{t('executive.hqKPIStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi) => (
                <tr key={kpi.id} className="border-b">
                  <td className="py-2">{kpi.title}</td>
                  <td className="text-right py-2 font-medium">{kpi.value}{kpi.unit}</td>
                  <td className="text-right py-2 text-muted-foreground">{kpi.target}{kpi.unit}</td>
                  <td className="text-right py-2">
                    <span className={kpi.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                      {kpi.trend > 0 ? '+' : ''}
                      {kpi.trend}%
                    </span>
                  </td>
                  <td className="text-center py-2">{getStatusBadge(kpi.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Separator />

        {/* 주요 성과 & 리스크 */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t('executive.hqKeyAchievements')}
            </h4>
            <ul className="space-y-2">
              {achievements.length > 0 ? achievements.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500">•</span>
                  {item}
                </li>
              )) : (
                <li className="text-sm text-muted-foreground">{t('executive.hqDataCollecting')}</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              {t('executive.hqRiskItems')}
            </h4>
            <ul className="space-y-2">
              {riskItems.map((item) => (
                <li key={item.description} className="text-sm p-2 bg-muted rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={item.severity === 'HIGH' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {item.severity}
                    </Badge>
                    {item.description}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('executive.hqAction')} {item.action}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator />

        {/* 차기 계획 */}
        <div>
          <h4 className="font-semibold mb-3">{t('executive.hqNextPlan')}</h4>
          <p className="text-sm text-muted-foreground">
            {t('executive.hqNextPlanDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

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

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [emps, progs, res, monthly, tqc] = await Promise.all([
          api.getEmployees(),
          api.getPrograms(),
          api.getResults(),
          api.getMonthlyTrainingData(),
          api.getNewTQCDashboardStats(),
        ]);
        setEmployees(emps);
        setPrograms(progs);
        setResults(res);
        setMonthlyData(monthly);
        setTqcStats(tqc);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
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
        trend: 0, // No historical comparison without stored snapshots
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('executive.tabOverview')}</TabsTrigger>
          <TabsTrigger value="roi">{t('executive.tabTraining')}</TabsTrigger>
          <TabsTrigger value="benchmark">{t('executive.tabBenchmark')}</TabsTrigger>
          <TabsTrigger value="report">{t('executive.tabHQReport')}</TabsTrigger>
        </TabsList>

        {/* 총괄 현황 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 월별 교육 현황 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('executive.monthlyChart')}</CardTitle>
                <CardDescription>{t('executive.monthlyChartDescPlanned')}</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyChartData.length > 0 ? (
                  <LazyBarChart
                    data={monthlyChartData}
                    height={300}
                    xAxisKey="period"
                    xAxisFormatter={(v) => v}
                    bars={[
                      { dataKey: 'planned', name: t('executive.chartPlanned'), fill: '#94A3B8', radius: [4, 4, 0, 0] },
                      { dataKey: 'completed', name: t('executive.chartCompleted'), fill: '#10B981', radius: [4, 4, 0, 0] },
                    ]}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    {t('executive.noSessionData')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 신입 교육 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  {t('executive.newTQCTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">
                        {tqcStats?.inTraining ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('executive.currentTraining')}</p>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {tqcStats?.completed ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('executive.trainingCompleted')}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('executive.totalTrainees')}</span>
                      <span className="font-medium">{tqcStats?.totalTrainees ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('executive.avgProgress')}</span>
                      <span className="font-medium">{tqcStats?.averageProgress ?? 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('executive.turnoverRate')}</span>
                      <span className="font-medium text-orange-600">
                        {tqcStats?.resignationRate ?? 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('executive.resignedCount')}</span>
                      <span className="font-medium">{tqcStats?.resigned ?? 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 교육 현황 (formerly ROI) */}
        <TabsContent value="roi" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpiResult?.totalEmployees ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{t('executive.totalActiveEmployees')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpiResult?.monthlyCompletions ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{t('executive.monthlyCompletions')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpiResult?.retrainingCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{t('executive.retrainingTarget')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpiResult?.averageScore ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{t('executive.avgScore')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('executive.monthlyTrendTitle')}</CardTitle>
              <CardDescription>{t('executive.monthlyTrendDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyChartData.length > 0 ? (
                <LazyLineChart
                  data={monthlyChartData}
                  height={350}
                  xAxisKey="period"
                  lines={[
                    { type: 'monotone', dataKey: 'completionRate', name: t('executive.completionRateLine'), stroke: '#8B5CF6', strokeWidth: 3 },
                  ]}
                />
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  {t('executive.noMonthlyData')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 교육 성과 구성 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('executive.trainingPerformanceTitle')}</CardTitle>
              <CardDescription>{t('executive.trainingPerformanceDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    label: t('executive.passRateLabel'),
                    value: kpiResult?.passRate ?? 0,
                    description: t('executive.passRateDesc'),
                    color: 'bg-green-500',
                  },
                  {
                    label: t('executive.firstTimePassRate'),
                    value: kpiResult?.firstTimePassRate ?? 0,
                    description: t('executive.firstTimePassRateDesc'),
                    color: 'bg-blue-500',
                  },
                  {
                    label: t('executive.completionRateLabel'),
                    value: kpiResult?.overallCompletionRate ?? 0,
                    description: t('executive.completionRateDesc'),
                    color: 'bg-purple-500',
                  },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.label}</span>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Badge variant="outline">{item.value}%</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 벤치마킹 */}
        <TabsContent value="benchmark" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {benchmarkData.filter((m) => (m.current / m.target) >= 1).length}/
                      {benchmarkData.length}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('executive.benchAchieved')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {benchmarkData.filter((m) =>
                        m.lowerIsBetter
                          ? m.current < m.industryAvg
                          : m.current > m.industryAvg
                      ).length}/{benchmarkData.length}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('executive.benchAboveIndustry')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {benchmarkData.filter((m) =>
                        m.lowerIsBetter
                          ? m.current < m.hwkGroupAvg
                          : m.current > m.hwkGroupAvg
                      ).length}/{benchmarkData.length}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('executive.benchAboveGroup')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {benchmarkData.filter((m) => (m.current / m.target) < 0.8).length}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('executive.benchNeedsImprovement')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('executive.benchDetailTitle')}</CardTitle>
              <CardDescription>
                {t('executive.benchDetailDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {benchmarkData.map((metric) => (
                <BenchmarkItem key={metric.metric} metric={metric} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 본사 리포트 */}
        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {t('executive.hqReportTitle')}
                  </CardTitle>
                  <CardDescription>
                    {t('executive.hqReportDesc')}
                  </CardDescription>
                </div>
                <Button onClick={handleExportExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('executive.excelDownload')}
                </Button>
              </div>
            </CardHeader>
          </Card>

          <HQReportPreview
            kpis={executiveKPIs}
            totalEmployees={kpiResult?.totalEmployees ?? 0}
            completionRate={kpiResult?.overallCompletionRate ?? 0}
            trendVsLast={0}
            roi={kpiResult?.passRate ?? 0}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
