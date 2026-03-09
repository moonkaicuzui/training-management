import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { EnrollmentLogsTableProps } from './types';

export function EnrollmentLogsTable({
  isLoadingLogs,
  enrollmentLogs,
}: EnrollmentLogsTableProps) {
  const { t } = useTranslation();

  if (isLoadingLogs) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (enrollmentLogs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
        {t('common.noData')}
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('recommendation.logs.date')}</TableHead>
            <TableHead>{t('recommendation.logs.tqc')}</TableHead>
            <TableHead>{t('recommendation.logs.employee')}</TableHead>
            <TableHead>{t('recommendation.logs.program')}</TableHead>
            <TableHead>{t('recommendation.logs.priority')}</TableHead>
            <TableHead className="text-right">
              {t('recommendation.logs.score')}
            </TableHead>
            <TableHead className="text-right">
              {t('recommendation.logs.rejectRate')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollmentLogs.map((log) => (
            <TableRow key={log.log_id}>
              <TableCell className="text-sm">
                {log.enrolled_at}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <span className="font-mono">{log.tqc_id}</span>
                  <span className="text-muted-foreground ml-1">
                    ({log.tqc_name})
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <span className="font-mono">{log.employee_id}</span>
                  <span className="text-muted-foreground ml-1">
                    ({log.employee_name})
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <Badge variant="outline" className="mr-1">
                    {log.program_code}
                  </Badge>
                  {log.program_name}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    log.priority === 'IMMEDIATE'
                      ? 'destructive'
                      : log.priority === 'SURGE'
                        ? 'warning'
                        : 'secondary'
                  }
                >
                  {t(`recommendation.priorities.${log.priority}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {log.priority_score}
              </TableCell>
              <TableCell className="text-right font-mono">
                {log.reject_rate.toFixed(2)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
