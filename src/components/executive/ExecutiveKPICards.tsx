/**
 * Executive Dashboard - KPI Cards & Benchmark Items
 * KPI 카드, 벤치마크 비교 항목 컴포넌트
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Users,
  Award,
  UserMinus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ExecutiveKPI, BenchmarkMetric } from '@/types/executive';

// KPI 카드 컴포넌트
export const KPICard = memo(function KPICard({ kpi }: { kpi: ExecutiveKPI }) {
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
export const BenchmarkItem = memo(function BenchmarkItem({
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
