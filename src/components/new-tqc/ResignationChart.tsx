import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LazyPieChart, LazyBarChart } from '@/components/charts/LazyCharts';
import type { NewTQCResignationAnalysis, ResignationReason } from '@/types/newTqc';

const REASON_KEYS: Record<ResignationReason, string> = {
  HEALTH_ISSUE: 'newTqc.resignations.reasons.healthIssue',
  FAMILY_MATTERS: 'newTqc.resignations.reasons.familyMatters',
  DISTANCE: 'newTqc.resignations.reasons.distance',
  LOW_SALARY: 'newTqc.resignations.reasons.lowSalary',
  JOB_CHANGE: 'newTqc.resignations.reasons.jobChange',
  ABSENCE: 'newTqc.resignations.reasons.absence',
  ACCIDENT: 'newTqc.resignations.reasons.accident',
  OTHER: 'newTqc.resignations.reasons.other',
};

const REASON_COLORS: Record<ResignationReason, string> = {
  HEALTH_ISSUE: '#EF4444',
  FAMILY_MATTERS: '#F97316',
  DISTANCE: '#EAB308',
  LOW_SALARY: '#22C55E',
  JOB_CHANGE: '#14B8A6',
  ABSENCE: '#3B82F6',
  ACCIDENT: '#8B5CF6',
  OTHER: '#6B7280',
};

interface ResignationChartProps {
  analysis: NewTQCResignationAnalysis | null;
  isLoading?: boolean;
}

export function ResignationPieChart({ analysis, isLoading }: ResignationChartProps) {
  const { t } = useTranslation();

  // Build translated reason labels
  const reasonLabels = useMemo(() => {
    const labels: Record<ResignationReason, string> = {} as Record<ResignationReason, string>;
    for (const [key, i18nKey] of Object.entries(REASON_KEYS)) {
      labels[key as ResignationReason] = t(i18nKey);
    }
    return labels;
  }, [t]);

  // Calculate total resignations from byReason array
  const totalResignations = useMemo(() => {
    if (!analysis) return 0;
    return analysis.byReason.reduce((sum, item) => sum + item.count, 0);
  }, [analysis]);

  // Transform data to match LazyPieChart expected format: { grade: string; count: number }[]
  const chartData = useMemo(() => {
    if (!analysis) return [];

    return analysis.byReason.map((item) => ({
      grade: reasonLabels[item.reason],
      count: item.count,
    }));
  }, [analysis, reasonLabels]);

  // Create colors map for pie chart
  const colors = useMemo(() => {
    const colorMap: Record<string, string> = {};
    Object.entries(reasonLabels).forEach(([key, label]) => {
      colorMap[label] = REASON_COLORS[key as ResignationReason];
    });
    return colorMap;
  }, [reasonLabels]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('newTqc.charts.reasonAnalysis')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded-full w-48 h-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('newTqc.charts.reasonAnalysis')}</CardTitle>
        <CardDescription>
          {t('newTqc.charts.totalResigned', { count: totalResignations })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <LazyPieChart
            data={chartData}
            height={300}
            colors={colors}
          />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t('newTqc.charts.noData')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ResignationByTeamChartProps {
  analysis: NewTQCResignationAnalysis | null;
  isLoading?: boolean;
}

export function ResignationByTeamChart({ analysis, isLoading }: ResignationByTeamChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!analysis) return [];

    return analysis.byTeam.map((item) => ({
      name: item.team,
      count: item.count,
    }));
  }, [analysis]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('newTqc.charts.teamAnalysis')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded w-full h-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('newTqc.charts.teamAnalysis')}</CardTitle>
        <CardDescription>{t('newTqc.charts.teamDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <LazyBarChart
            data={chartData}
            height={300}
            bars={[
              { dataKey: 'count', fill: '#3B82F6', radius: [4, 4, 0, 0] },
            ]}
          />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t('newTqc.charts.noData')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ResignationByMonthChartProps {
  analysis: NewTQCResignationAnalysis | null;
  isLoading?: boolean;
}

export function ResignationByMonthChart({ analysis, isLoading }: ResignationByMonthChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!analysis) return [];

    return analysis.byMonth.map((item) => ({
      name: item.month,
      count: item.count,
    }));
  }, [analysis]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('newTqc.charts.monthlyTrend')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded w-full h-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('newTqc.charts.monthlyTrend')}</CardTitle>
        <CardDescription>{t('newTqc.charts.monthlyDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <LazyBarChart
            data={chartData}
            height={300}
            bars={[
              { dataKey: 'count', fill: '#EF4444', radius: [4, 4, 0, 0] },
            ]}
          />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t('newTqc.charts.noData')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Summary Stats Card
interface ResignationStatsProps {
  analysis: NewTQCResignationAnalysis | null;
}

export function ResignationStats({ analysis }: ResignationStatsProps) {
  const { t } = useTranslation();

  // Build translated reason labels
  const reasonLabels = useMemo(() => {
    const labels: Record<ResignationReason, string> = {} as Record<ResignationReason, string>;
    for (const [key, i18nKey] of Object.entries(REASON_KEYS)) {
      labels[key as ResignationReason] = t(i18nKey);
    }
    return labels;
  }, [t]);

  // Calculate total resignations from byReason array
  const totalResignations = useMemo(() => {
    if (!analysis) return 0;
    return analysis.byReason.reduce((sum, item) => sum + item.count, 0);
  }, [analysis]);

  if (!analysis) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('newTqc.charts.totalCount')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{t('newTqc.charts.countPeople', { count: totalResignations })}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('newTqc.charts.avgDuration')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{t('newTqc.charts.daysCount', { count: analysis.averageTrainingDays })}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('newTqc.charts.topReason')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analysis.byReason.length > 0
              ? reasonLabels[analysis.byReason[0].reason]
              : '-'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
