import { useTranslation } from 'react-i18next';
import { RefreshCcw, Loader2 } from 'lucide-react';
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
import { EmptyMessage } from './HRHelperComponents';
import type { QualitySync } from '@/services/hrAnalyticsService';

interface QualityTabProps {
  data: QualitySync[];
  loading: boolean;
  onLoad: () => void;
}

export default function QualityTab({ data, loading, onLoad }: QualityTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardDescription>{t('hrAnalytics.quality.description')}</CardDescription>
        <Button onClick={onLoad} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
          {t('hrAnalytics.loadData')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : data.length === 0 ? (
        <EmptyMessage message={t('hrAnalytics.empty.quality')} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('hrAnalytics.quality.comparisonTitle')}
              <Badge variant="outline" className="ml-2">
                {data.filter((d) => d.discrepancy).length} {t('hrAnalytics.quality.discrepancies')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('hrAnalytics.table.employee')}</TableHead>
                  <TableHead className="text-right">{t('hrAnalytics.quality.qtrainAql')}</TableHead>
                  <TableHead className="text-right">{t('hrAnalytics.quality.hrV2Aql')}</TableHead>
                  <TableHead>{t('hrAnalytics.quality.inspGrade')}</TableHead>
                  <TableHead className="text-center">{t('hrAnalytics.quality.match')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 50).map((row) => (
                  <TableRow
                    key={row.employeeId}
                    className={row.discrepancy ? 'bg-red-50 dark:bg-red-950/20' : ''}
                  >
                    <TableCell className="font-medium">{row.employeeName}</TableCell>
                    <TableCell className="text-right">
                      {row.qtrain.aqlFailRate !== undefined ? `${row.qtrain.aqlFailRate.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.hrV2.aqlPassRate !== undefined ? `${row.hrV2.aqlPassRate.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell>{row.qtrain.inspectionGrade || '-'}</TableCell>
                    <TableCell className="text-center">
                      {row.discrepancy ? (
                        <Badge variant="destructive">{t('hrAnalytics.quality.mismatch')}</Badge>
                      ) : (
                        <Badge variant="secondary">{t('hrAnalytics.quality.ok')}</Badge>
                      )}
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
