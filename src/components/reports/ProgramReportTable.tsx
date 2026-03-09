import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProgramReport } from './types';

interface ProgramReportTableProps {
  reports: ProgramReport[];
}

export function ProgramReportTable({ reports }: ProgramReportTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.progTitle')}</CardTitle>
        <CardDescription>{t('reports.progDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reports.colProgramCode')}</TableHead>
              <TableHead>{t('reports.colProgramName')}</TableHead>
              <TableHead className="text-right">{t('reports.colSessionCount')}</TableHead>
              <TableHead className="text-right">{t('reports.colTraineeCount')}</TableHead>
              <TableHead className="text-right">{t('reports.colPass')}</TableHead>
              <TableHead className="text-right">{t('reports.colFail')}</TableHead>
              <TableHead className="text-right">{t('reports.colPassRate')}</TableHead>
              <TableHead className="text-right">{t('reports.colAvgScore')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.program_code}>
                <TableCell>
                  <Badge variant="outline">{report.program_code}</Badge>
                </TableCell>
                <TableCell className="font-medium">{report.program_name}</TableCell>
                <TableCell className="text-right">{report.totalSessions}</TableCell>
                <TableCell className="text-right">{report.totalTrainees}</TableCell>
                <TableCell className="text-right text-green-600">{report.passCount}</TableCell>
                <TableCell className="text-right text-red-600">{report.failCount}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={report.passRate >= 80 ? 'success' : report.passRate >= 50 ? 'warning' : 'destructive'}>
                    {report.passRate}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{report.averageScore}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
