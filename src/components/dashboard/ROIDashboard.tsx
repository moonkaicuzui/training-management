/**
 * ROI Dashboard Component
 * 교육 투자 대비 수익률 (ROI) 분석 대시보드
 */

import { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  LazyBarChart,
  LazyLineChart,
} from '@/components/charts/LazyCharts';
import type {
  Employee,
  TrainingProgram,
  TrainingResultRecord,
} from '@/types';
import type { TrainingCost } from '@/services/roiService';

// ========== Types ==========

interface ROIDashboardProps {
  employees: Employee[];
  programs: TrainingProgram[];
  results: TrainingResultRecord[];
  trainingCosts: TrainingCost[];
  isLoading: boolean;
}

// ========== Constants ==========

const DEFAULT_COST_PER_SESSION = 500_000; // 500k VND default estimate per session
const BASELINE_PRODUCTIVITY_VALUE = 2_000_000; // 2M VND baseline value per trained employee

// ========== Helper Functions ==========

function formatVND(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('vi-VN').format(value);
}

// ========== Component ==========

const ROIDashboard = memo(function ROIDashboard({
  employees,
  programs,
  results,
  trainingCosts,
  isLoading,
}: ROIDashboardProps) {
  const { t } = useTranslation();

  // Calculate total training cost
  const totalCost = useMemo(() => {
    if (trainingCosts.length > 0) {
      return trainingCosts.reduce((sum, c) => sum + c.total, 0);
    }
    // Fallback: estimate based on number of unique sessions
    const uniqueSessions = new Set(results.map((r) => r.session_id).filter(Boolean));
    return uniqueSessions.size * DEFAULT_COST_PER_SESSION;
  }, [trainingCosts, results]);

  // Calculate trained employees count
  const trainedEmployees = useMemo(() => {
    const uniqueEmployees = new Set(results.map((r) => r.employee_id));
    return uniqueEmployees.size;
  }, [results]);

  // Cost per employee
  const costPerEmployee = useMemo(() => {
    if (trainedEmployees === 0) return 0;
    return Math.round(totalCost / trainedEmployees);
  }, [totalCost, trainedEmployees]);

  // Pass rate
  const passRate = useMemo(() => {
    if (results.length === 0) return 0;
    const passed = results.filter((r) => r.result === 'PASS').length;
    return Math.round((passed / results.length) * 100);
  }, [results]);

  // Training effectiveness (pass rate as a proxy)
  const trainingEffectiveness = passRate;

  // Estimated productivity gain
  const productivityGain = useMemo(() => {
    return Math.round((passRate / 100) * trainedEmployees * BASELINE_PRODUCTIVITY_VALUE);
  }, [passRate, trainedEmployees]);

  // ROI percentage
  const roiPercentage = useMemo(() => {
    if (totalCost === 0) return 0;
    return Math.round(((productivityGain - totalCost) / totalCost) * 100);
  }, [productivityGain, totalCost]);

  // Monthly cost trend data (last 12 months)
  const monthlyCostData = useMemo(() => {
    const now = new Date();
    const monthsData: { period: string; cost: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });

      const costEntry = trainingCosts.find((c) => c.period === periodKey);
      monthsData.push({
        period: monthLabel,
        cost: costEntry ? costEntry.total : 0,
      });
    }

    return monthsData;
  }, [trainingCosts]);

  // ROI by department
  const roiByDepartment = useMemo(() => {
    const deptMap: Record<string, { passed: number; total: number; employees: Set<string> }> = {};

    for (const result of results) {
      const employee = employees.find((e) => e.employee_id === result.employee_id);
      const dept = employee?.building || 'Unknown';

      if (!deptMap[dept]) {
        deptMap[dept] = { passed: 0, total: 0, employees: new Set() };
      }
      deptMap[dept].total++;
      deptMap[dept].employees.add(result.employee_id);
      if (result.result === 'PASS') {
        deptMap[dept].passed++;
      }
    }

    return Object.entries(deptMap)
      .map(([dept, data]) => {
        const deptPassRate = data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0;
        const deptCostShare = trainedEmployees > 0
          ? Math.round((data.employees.size / trainedEmployees) * totalCost)
          : 0;
        const deptGain = Math.round((deptPassRate / 100) * data.employees.size * BASELINE_PRODUCTIVITY_VALUE);
        const deptROI = deptCostShare > 0
          ? Math.round(((deptGain - deptCostShare) / deptCostShare) * 100)
          : 0;

        return {
          department: dept,
          roi: deptROI,
          passRate: deptPassRate,
        };
      })
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 8);
  }, [results, employees, totalCost, trainedEmployees]);

  // Cost vs Pass Rate by program
  const costVsPassByProgram = useMemo(() => {
    const programMap: Record<string, { passed: number; total: number; sessions: Set<string> }> = {};

    for (const result of results) {
      const code = result.program_code;
      if (!programMap[code]) {
        programMap[code] = { passed: 0, total: 0, sessions: new Set() };
      }
      programMap[code].total++;
      if (result.session_id) {
        programMap[code].sessions.add(result.session_id);
      }
      if (result.result === 'PASS') {
        programMap[code].passed++;
      }
    }

    return Object.entries(programMap)
      .map(([code, data]) => {
        const program = programs.find((p) => p.program_code === code);
        const programPassRate = data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0;
        // Estimate cost by number of sessions
        const estimatedCost = data.sessions.size * DEFAULT_COST_PER_SESSION;
        const costInMillions = Math.round(estimatedCost / 1_000_000);

        return {
          program: program?.program_name || code,
          cost: costInMillions,
          passRate: programPassRate,
        };
      })
      .sort((a, b) => b.passRate - a.passRate)
      .slice(0, 8);
  }, [results, programs]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No data state
  const hasData = results.length > 0 || trainingCosts.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            {t('executive.noROIData')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatVND(totalCost)}</p>
                <p className="text-xs text-muted-foreground">{t('executive.totalCost')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatVND(costPerEmployee)}</p>
                <p className="text-xs text-muted-foreground">{t('executive.costPerEmployee')}</p>
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
                <p className="text-2xl font-bold">{roiPercentage}%</p>
                <p className="text-xs text-muted-foreground">{t('executive.estimatedROI')}</p>
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
                <p className="text-2xl font-bold">{trainingEffectiveness}%</p>
                <p className="text-xs text-muted-foreground">{t('executive.trainingEffectiveness')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Cost Trend */}
        <Card>
          <CardHeader>
            <CardTitle>{t('executive.monthlyCostTrend')}</CardTitle>
            <CardDescription>{t('executive.roiDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyCostData.some((d) => d.cost > 0) ? (
              <LazyLineChart
                data={monthlyCostData}
                height={300}
                xAxisKey="period"
                lines={[
                  {
                    dataKey: 'cost',
                    name: t('executive.totalCost'),
                    stroke: '#EF4444',
                    strokeWidth: 2,
                    type: 'monotone',
                  },
                ]}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {t('executive.noROIData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ROI by Department */}
        <Card>
          <CardHeader>
            <CardTitle>{t('executive.roiByDepartment')}</CardTitle>
            <CardDescription>{t('executive.roiDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {roiByDepartment.length > 0 ? (
              <LazyBarChart
                data={roiByDepartment}
                height={300}
                xAxisKey="department"
                bars={[
                  {
                    dataKey: 'roi',
                    name: 'ROI (%)',
                    fill: '#8B5CF6',
                    radius: [4, 4, 0, 0],
                  },
                ]}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {t('executive.noROIData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost vs Pass Rate by Program */}
      <Card>
        <CardHeader>
          <CardTitle>{t('executive.costVsPassRate')}</CardTitle>
          <CardDescription>{t('executive.roiDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {costVsPassByProgram.length > 0 ? (
            <LazyBarChart
              data={costVsPassByProgram}
              height={350}
              xAxisKey="program"
              bars={[
                {
                  dataKey: 'cost',
                  name: `${t('executive.totalCost')} (M VND)`,
                  fill: '#EF4444',
                  radius: [4, 4, 0, 0],
                },
                {
                  dataKey: 'passRate',
                  name: `${t('executive.passRateLabel')} (%)`,
                  fill: '#10B981',
                  radius: [4, 4, 0, 0],
                },
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              {t('executive.noROIData')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

export default ROIDashboard;
