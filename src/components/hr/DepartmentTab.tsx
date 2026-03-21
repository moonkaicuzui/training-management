import { useTranslation } from 'react-i18next';
import { Building2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LazyBarChart } from '@/components/charts/LazyCharts';
import { EmptyMessage } from './HRHelperComponents';
import type { DepartmentTrainingRate } from '@/services/hrAnalyticsService';

interface DepartmentTabProps {
  data: DepartmentTrainingRate[];
  loading: boolean;
  onLoad: () => void;
}

export default function DepartmentTab({ data, loading, onLoad }: DepartmentTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardDescription>{t('hrAnalytics.department.description')}</CardDescription>
        <Button onClick={onLoad} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Building2 className="h-4 w-4 mr-2" />}
          {t('hrAnalytics.loadData')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : data.length === 0 ? (
        <EmptyMessage message={t('hrAnalytics.empty.department')} />
      ) : (
        <>
          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('hrAnalytics.department.chartTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyBarChart
                data={data.map((d) => ({
                  name: d.department,
                  completionRate: d.completionRate,
                  passRate: d.passRate,
                }))}
                height={300}
                bars={[
                  { dataKey: 'completionRate', name: t('hrAnalytics.department.completionRate'), fill: '#3b82f6' },
                  { dataKey: 'passRate', name: t('hrAnalytics.department.passRate'), fill: '#22c55e' },
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
                    <TableHead>{t('hrAnalytics.department.dept')}</TableHead>
                    <TableHead className="text-right">{t('hrAnalytics.department.active')}</TableHead>
                    <TableHead className="text-right">{t('hrAnalytics.department.completionRate')}</TableHead>
                    <TableHead className="text-right">{t('hrAnalytics.department.avgScore')}</TableHead>
                    <TableHead className="text-right">{t('hrAnalytics.department.passRate')}</TableHead>
                    <TableHead>{t('hrAnalytics.department.topPerformers')}</TableHead>
                    <TableHead>{t('hrAnalytics.department.needsAttention')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.department}>
                      <TableCell className="font-medium">{row.department}</TableCell>
                      <TableCell className="text-right">{row.activeEmployees}</TableCell>
                      <TableCell className="text-right">
                        <span className={row.completionRate >= 80 ? 'text-green-600' : row.completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                          {row.completionRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{row.avgScore || '-'}</TableCell>
                      <TableCell className="text-right">{row.passRate}%</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.topPerformers.map((n, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{n}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.needsAttention.slice(0, 3).map((n, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">{n}</Badge>
                          ))}
                          {row.needsAttention.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{row.needsAttention.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
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
