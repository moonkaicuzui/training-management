import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { FactoryCode, ImprovementStatus, MDWeeklyComparison } from '@/types/metalDetector';

const IMPROVEMENT_CONFIG: Record<ImprovementStatus, { color: string; icon: typeof TrendingDown; label: string }> = {
  improved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: TrendingDown, label: 'metalDetector.weeklyReport.improved' },
  no_change: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400', icon: Minus, label: 'metalDetector.weeklyReport.noChange' },
  increased: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: TrendingUp, label: 'metalDetector.weeklyReport.increased' },
};

interface MDFactoryComparisonProps {
  comp: MDWeeklyComparison | null;
}

export default function MDFactoryComparison({ comp }: MDFactoryComparisonProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Factory Comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('metalDetector.weeklyReport.factoryComparison')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('metalDetector.factory.label')}</TableHead>
                <TableHead className="text-center">{t('metalDetector.weeklyReport.failedLastWeek')}</TableHead>
                <TableHead className="text-center">{t('metalDetector.weeklyReport.failedThisWeek')}</TableHead>
                <TableHead className="text-center">{t('metalDetector.weeklyReport.improvement')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comp && Object.keys(comp.factoryComparison).map((f) => {
                const fc = comp.factoryComparison[f as FactoryCode];
                const status = fc?.improvement ?? 'no_change';
                const config = IMPROVEMENT_CONFIG[status];
                const Icon = config.icon;
                return (
                  <TableRow key={f}>
                    <TableCell className="font-medium">{f}</TableCell>
                    <TableCell className="text-center">{fc?.failedLastWeek ?? 0}</TableCell>
                    <TableCell className="text-center">{fc?.failedThisWeek ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={config.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {t(config.label)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pass Rate Comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('metalDetector.weeklyReport.passRateComparison')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="text-center p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">
                {t('metalDetector.weeklyReport.lastWeek')} (W{comp?.lastWeek.weekNumber})
              </p>
              <p className="text-2xl font-bold">{comp ? `${comp.lastWeek.passRate.toFixed(0)}%` : '-'}</p>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">
                {t('metalDetector.weeklyReport.thisWeek')} (W{comp?.thisWeek.weekNumber})
              </p>
              <p className="text-2xl font-bold">{comp ? `${comp.thisWeek.passRate.toFixed(0)}%` : '-'}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('metalDetector.factory.label')}</TableHead>
                <TableHead className="text-center">
                  {t('metalDetector.weeklyReport.lastWeek')} (W{comp?.lastWeek.weekNumber})
                </TableHead>
                <TableHead className="text-center">
                  {t('metalDetector.weeklyReport.thisWeek')} (W{comp?.thisWeek.weekNumber})
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comp && Object.keys(comp.thisWeek.byFactory).map((f) => {
                const lw = comp.lastWeek.byFactory[f as FactoryCode];
                const tw = comp.thisWeek.byFactory[f as FactoryCode];
                return (
                  <TableRow key={f}>
                    <TableCell className="font-medium">{f}</TableCell>
                    <TableCell className="text-center">
                      {lw ? `${lw.passRate.toFixed(0)}%` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={
                        tw && lw
                          ? tw.passRate > lw.passRate ? 'text-green-600 font-medium' :
                            tw.passRate < lw.passRate ? 'text-red-600 font-medium' : ''
                          : ''
                      }>
                        {tw ? `${tw.passRate.toFixed(0)}%` : '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-bold border-t-2">
                <TableCell>Total</TableCell>
                <TableCell className="text-center">
                  {comp ? `${comp.lastWeek.passRate.toFixed(0)}%` : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {comp ? `${comp.thisWeek.passRate.toFixed(0)}%` : '-'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
