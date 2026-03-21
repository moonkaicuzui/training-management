import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCcw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { KPICard, EmptyMessage } from './HRHelperComponents';
import type { TrainingEffectivenessResult } from '@/services/hrAnalyticsService';

interface EffectivenessTabProps {
  data: TrainingEffectivenessResult[];
  loading: boolean;
  onLoad: () => void;
}

export default function EffectivenessTab({ data, loading, onLoad }: EffectivenessTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardDescription>{t('hrAnalytics.effectiveness.description')}</CardDescription>
        <Button onClick={onLoad} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
          {t('hrAnalytics.loadData')}
        </Button>
      </div>

      {data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <KPICard
            title={t('hrAnalytics.effectiveness.totalAnalyzed')}
            value={data.length}
            icon={BarChart3}
          />
          <KPICard
            title={t('hrAnalytics.effectiveness.avgRiskChange')}
            value={
              data.filter((d) => d.improvement.riskChange !== undefined).length > 0
                ? `${(data
                    .filter((d) => d.improvement.riskChange !== undefined)
                    .reduce((s, d) => s + (d.improvement.riskChange || 0), 0) /
                    data.filter((d) => d.improvement.riskChange !== undefined).length
                  ).toFixed(1)}`
                : '-'
            }
            icon={TrendingDown}
            trend="down"
          />
          <KPICard
            title={t('hrAnalytics.effectiveness.avgAqlChange')}
            value={
              data.filter((d) => d.improvement.aqlChange !== undefined).length > 0
                ? `${(data
                    .filter((d) => d.improvement.aqlChange !== undefined)
                    .reduce((s, d) => s + (d.improvement.aqlChange || 0), 0) /
                    data.filter((d) => d.improvement.aqlChange !== undefined).length
                  ).toFixed(1)}%`
                : '-'
            }
            icon={TrendingUp}
            trend="up"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : data.length === 0 ? (
        <EmptyMessage message={t('hrAnalytics.empty.effectiveness')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('hrAnalytics.table.employee')}</TableHead>
                  <TableHead>{t('hrAnalytics.table.program')}</TableHead>
                  <TableHead>{t('hrAnalytics.table.date')}</TableHead>
                  <TableHead className="text-right">{t('hrAnalytics.effectiveness.before')}</TableHead>
                  <TableHead className="text-right">{t('hrAnalytics.effectiveness.after')}</TableHead>
                  <TableHead className="text-right">{t('hrAnalytics.effectiveness.change')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 50).map((row, idx) => (
                  <TableRow key={`${row.employeeId}-${row.programCode}-${idx}`}>
                    <TableCell className="font-medium">{row.employeeName}</TableCell>
                    <TableCell>{row.programCode}</TableCell>
                    <TableCell>{row.trainingDate}</TableCell>
                    <TableCell className="text-right">
                      {row.beforeMetrics.riskScore ?? '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.afterMetrics.riskScore ?? '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.improvement.riskChange !== undefined ? (
                        <span className={row.improvement.riskChange > 0 ? 'text-green-600' : 'text-red-600'}>
                          {row.improvement.riskChange > 0 ? '-' : '+'}{Math.abs(row.improvement.riskChange).toFixed(1)}
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
