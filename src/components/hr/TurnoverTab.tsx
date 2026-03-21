import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LazyLineChart } from '@/components/charts/LazyCharts';
import { KPICard, EmptyMessage } from './HRHelperComponents';
import type { TurnoverTrainingCorrelation } from '@/services/hrAnalyticsService';

interface TurnoverTabProps {
  data: TurnoverTrainingCorrelation[];
  loading: boolean;
  onLoad: () => void;
}

export default function TurnoverTab({ data, loading, onLoad }: TurnoverTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardDescription>{t('hrAnalytics.turnover.description')}</CardDescription>
        <Button onClick={onLoad} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
          {t('hrAnalytics.loadData')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : data.length === 0 ? (
        <EmptyMessage message={t('hrAnalytics.empty.turnover')} />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <KPICard
              title={t('hrAnalytics.turnover.trainingRetention')}
              value={`${data[data.length - 1]?.trainingRetentionRate ?? 0}%`}
              subtitle={t('hrAnalytics.turnover.trainedRetention')}
              icon={TrendingUp}
              trend="up"
            />
            <KPICard
              title={t('hrAnalytics.turnover.noTrainingRetention')}
              value={`${data[data.length - 1]?.noTrainingRetentionRate ?? 0}%`}
              subtitle={t('hrAnalytics.turnover.untrainedRetention')}
              icon={TrendingDown}
              trend="down"
            />
            <KPICard
              title={t('hrAnalytics.turnover.tqcSurvival')}
              value={`${data[data.length - 1]?.tqcCompletionSurvivalRate ?? 0}%`}
              subtitle={t('hrAnalytics.turnover.tqcSurvivalDesc')}
              icon={BarChart3}
            />
          </div>

          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('hrAnalytics.turnover.chartTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyLineChart
                data={data.map((d) => ({
                  name: d.period.replace('_', ' '),
                  trainingRetention: d.trainingRetentionRate,
                  noTrainingRetention: d.noTrainingRetentionRate,
                  tqcSurvival: d.tqcCompletionSurvivalRate,
                }))}
                height={300}
                lines={[
                  { dataKey: 'trainingRetention', name: t('hrAnalytics.turnover.trainedLine'), stroke: '#22c55e', strokeWidth: 2 },
                  { dataKey: 'noTrainingRetention', name: t('hrAnalytics.turnover.untrainedLine'), stroke: '#ef4444', strokeWidth: 2 },
                  { dataKey: 'tqcSurvival', name: t('hrAnalytics.turnover.tqcLine'), stroke: '#3b82f6', strokeWidth: 2, type: 'monotone' },
                ]}
                xAxisKey="name"
              />
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('hrAnalytics.turnover.period')}</TableHead>
                    <TableHead className="text-right">{t('hrAnalytics.turnover.totalResignations')}</TableHead>
                    <TableHead className="text-right">{t('hrAnalytics.turnover.withTraining')}</TableHead>
                    <TableHead className="text-right">{t('hrAnalytics.turnover.withoutTraining')}</TableHead>
                    <TableHead className="text-right">{t('hrAnalytics.turnover.trainedRetentionShort')}</TableHead>
                    <TableHead className="text-right">{t('hrAnalytics.turnover.untrainedRetentionShort')}</TableHead>
                    <TableHead className="text-right">{t('hrAnalytics.turnover.avgHoursResigned')}</TableHead>
                    <TableHead className="text-right">{t('hrAnalytics.turnover.avgHoursRetained')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.period}>
                      <TableCell className="font-medium">{row.period.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right">{row.totalResignations}</TableCell>
                      <TableCell className="text-right">{row.resignedWithTraining}</TableCell>
                      <TableCell className="text-right">{row.resignedWithoutTraining}</TableCell>
                      <TableCell className="text-right text-green-600">{row.trainingRetentionRate}%</TableCell>
                      <TableCell className="text-right text-red-600">{row.noTrainingRetentionRate}%</TableCell>
                      <TableCell className="text-right">{row.avgTrainingHoursResigned}h</TableCell>
                      <TableCell className="text-right">{row.avgTrainingHoursRetained}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
