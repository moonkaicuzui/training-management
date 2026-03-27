/**
 * HMDashboard — 온도-습도 모니터링 장치 대시보드
 */

import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, Thermometer, AlertTriangle } from 'lucide-react';
import { LazyLineChart } from '@/components/charts/LazyCharts';
import { useHMMonitorStore } from '@/stores/hmMonitorStore';
import HMKPICards from '@/components/humidity-monitor/HMKPICards';
import HMBuildingComparison from '@/components/humidity-monitor/HMBuildingComparison';
import HMInspectionHistory from '@/components/humidity-monitor/HMInspectionHistory';

export default function HMDashboard() {
  const { t } = useTranslation();
  const {
    inspections, dashboardKPI, trend, buildingComparison, repeatedIssues, isLoading,
    fetchDevices, fetchInspections, fetchDashboardKPI, fetchTrend, fetchBuildingComparison, fetchRepeatedIssues,
  } = useHMMonitorStore(useShallow((s) => ({
    inspections: s.inspections, dashboardKPI: s.dashboardKPI,
    trend: s.trend, buildingComparison: s.buildingComparison,
    repeatedIssues: s.repeatedIssues, isLoading: s.isLoading,
    fetchDevices: s.fetchDevices, fetchInspections: s.fetchInspections,
    fetchDashboardKPI: s.fetchDashboardKPI, fetchTrend: s.fetchTrend,
    fetchBuildingComparison: s.fetchBuildingComparison, fetchRepeatedIssues: s.fetchRepeatedIssues,
  })));

  useEffect(() => {
    fetchDevices();
    fetchInspections();
    fetchDashboardKPI();
    fetchTrend(12);
    fetchBuildingComparison();
    fetchRepeatedIssues(3);
  }, [fetchDevices, fetchInspections, fetchDashboardKPI, fetchTrend, fetchBuildingComparison, fetchRepeatedIssues]);

  const trendChartData = useMemo(() =>
    trend.map((item) => ({
      name: item.inspectionDate.slice(5), // MM-DD
      normalRate: item.okRate,
    })),
    [trend],
  );

  if (isLoading && inspections.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Thermometer className="h-6 w-6" />{t('humidityMonitor.dashboard.title')}
        </h1>
        <p className="text-muted-foreground">{t('humidityMonitor.dashboard.description')}</p>
      </div>

      <HMKPICards kpi={dashboardKPI} />

      {trendChartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t('humidityMonitor.dashboard.trendTitle')}</CardTitle></CardHeader>
          <CardContent>
            <LazyLineChart
              data={trendChartData}
              height={300}
              lines={[{ dataKey: 'normalRate', name: t('humidityMonitor.dashboard.okRate'), stroke: '#3b82f6', strokeWidth: 2 }]}
              xAxisKey="name"
            />
          </CardContent>
        </Card>
      )}

      <HMBuildingComparison data={buildingComparison} />

      {repeatedIssues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />{t('humidityMonitor.dashboard.repeatedTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('humidityMonitor.table.area')}</TableHead>
                  <TableHead>{t('humidityMonitor.dashboard.repeatedTitle')}</TableHead>
                  <TableHead>{t('humidityMonitor.table.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repeatedIssues.map((issue) => (
                  <TableRow key={issue.deviceId}>
                    <TableCell className="font-medium">{issue.area}</TableCell>
                    <TableCell className="font-mono">{issue.consecutiveNoOk}x</TableCell>
                    <TableCell><Badge variant="destructive">NO OK</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <HMInspectionHistory inspections={inspections} />
    </div>
  );
}
