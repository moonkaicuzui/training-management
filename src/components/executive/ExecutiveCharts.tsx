/**
 * Executive Dashboard - Charts & Training Status Tabs
 * 월별 교육 차트, 신입 TQC 현황, 교육 성과, ROI 분석, 벤치마크 탭
 */

import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Target,
  GraduationCap,
  CheckCircle2,
  Building2,
  PlusCircle,
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
import {
  LazyBarChart,
  LazyLineChart,
} from '@/components/charts/LazyCharts';
import { BenchmarkItem } from './ExecutiveKPICards';
import ROIDashboard from '@/components/dashboard/ROIDashboard';
import CostInputForm from '@/components/dashboard/CostInputForm';
import type { BenchmarkMetric } from '@/types/executive';
import type {
  Employee,
  TrainingProgram,
  TrainingResultRecord,
  NewTQCDashboardStats,
} from '@/types';
import type { KPICalculationResult } from '@/utils/kpiCalculator';
import type { TrainingCost } from '@/services/roiService';

// ========== Overview Tab ==========

interface OverviewTabProps {
  monthlyChartData: Array<{
    period: string;
    planned: number;
    completed: number;
    completionRate: number;
  }>;
  tqcStats: NewTQCDashboardStats | null;
}

export function OverviewTab({ monthlyChartData, tqcStats }: OverviewTabProps) {
  const { t } = useTranslation();

  return (
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
  );
}

// ========== Training Status Tab (formerly ROI) ==========

interface TrainingStatusTabProps {
  kpiResult: KPICalculationResult | null;
  monthlyChartData: Array<{
    period: string;
    planned: number;
    completed: number;
    completionRate: number;
  }>;
}

export function TrainingStatusTab({ kpiResult, monthlyChartData }: TrainingStatusTabProps) {
  const { t } = useTranslation();

  return (
    <>
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
    </>
  );
}

// ========== ROI Analysis Tab ==========

interface ROIAnalysisTabProps {
  employees: Employee[];
  programs: TrainingProgram[];
  filteredResults: TrainingResultRecord[];
  trainingCosts: TrainingCost[];
  loading: boolean;
  costFormOpen: boolean;
  setCostFormOpen: (open: boolean) => void;
  onCostSaved: () => void;
}

export function ROIAnalysisTab({
  employees,
  programs,
  filteredResults,
  trainingCosts,
  loading,
  costFormOpen,
  setCostFormOpen,
  onCostSaved,
}: ROIAnalysisTabProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('executive.roi')}</h2>
          <p className="text-sm text-muted-foreground">{t('executive.roiDescription')}</p>
        </div>
        <Button onClick={() => setCostFormOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {t('executive.addCost')}
        </Button>
      </div>

      <ROIDashboard
        employees={employees}
        programs={programs}
        results={filteredResults}
        trainingCosts={trainingCosts}
        isLoading={loading}
      />

      <CostInputForm
        open={costFormOpen}
        onClose={() => setCostFormOpen(false)}
        onSaved={onCostSaved}
      />
    </>
  );
}

// ========== Benchmark Tab ==========

interface BenchmarkTabProps {
  benchmarkData: BenchmarkMetric[];
}

export function BenchmarkTab({ benchmarkData }: BenchmarkTabProps) {
  const { t } = useTranslation();

  return (
    <>
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
    </>
  );
}
