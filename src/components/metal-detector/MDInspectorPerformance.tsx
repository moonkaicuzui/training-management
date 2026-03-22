import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { UserCheck } from 'lucide-react';

interface InspectorStat {
  inspectorId: string;
  inspectorName: string;
  total: number;
  pass: number;
  fail: number;
  passRate: number;
}

interface MDInspectorPerformanceProps {
  stats: InspectorStat[];
}

export default function MDInspectorPerformance({ stats }: MDInspectorPerformanceProps) {
  const { t } = useTranslation();

  if (stats.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          {t('metalDetector.dashboard.inspectorPerformance')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('metalDetector.input.inspectorId')}</TableHead>
              <TableHead>{t('metalDetector.input.inspector')}</TableHead>
              <TableHead className="text-center">{t('metalDetector.dashboard.totalInspections')}</TableHead>
              <TableHead className="text-center">{t('metalDetector.result.pass')}</TableHead>
              <TableHead className="text-center">{t('metalDetector.result.fail')}</TableHead>
              <TableHead className="text-center">{t('metalDetector.dashboard.passRate')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => (
              <TableRow key={stat.inspectorId}>
                <TableCell className="font-mono text-sm">{stat.inspectorId}</TableCell>
                <TableCell>{stat.inspectorName}</TableCell>
                <TableCell className="text-center font-medium">{stat.total}</TableCell>
                <TableCell className="text-center text-green-600">{stat.pass}</TableCell>
                <TableCell className="text-center text-red-600">{stat.fail}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={
                      stat.passRate === 100
                        ? 'text-green-600 border-green-200'
                        : stat.passRate >= 90
                          ? 'text-blue-600 border-blue-200'
                          : 'text-red-600 border-red-200'
                    }
                  >
                    {stat.passRate.toFixed(0)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
