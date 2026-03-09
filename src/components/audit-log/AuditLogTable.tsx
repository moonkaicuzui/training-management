import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { FileText, User, Calendar, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import type { AuditLogTableProps } from './types';

export function AuditLogTable({
  logs,
  onViewDetail,
  getActionIcon,
  getActionBadge,
}: AuditLogTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auditLog.title')}</CardTitle>
        <CardDescription>
          {t('auditLog.filteredCount', { count: logs.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('auditLog.logId')}</TableHead>
              <TableHead>{t('auditLog.action')}</TableHead>
              <TableHead>{t('auditLog.target')}</TableHead>
              <TableHead>{t('auditLog.targetId')}</TableHead>
              <TableHead>{t('auditLog.operator')}</TableHead>
              <TableHead>{t('auditLog.dateTime')}</TableHead>
              <TableHead>{t('auditLog.ipAddress')}</TableHead>
              <TableHead className="text-right">{t('auditLog.detailButton')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {t('auditLog.emptyState')}
                </TableCell>
              </TableRow>
            ) : (
              logs.slice(0, 50).map((log) => (
                <TableRow key={log.log_id}>
                  <TableCell className="font-mono text-xs">{log.log_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <Badge variant={getActionBadge(log.action)}>
                        {log.action}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.entity_type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.entity_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm truncate max-w-[120px]">{log.changed_by}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(log.changed_at), 'yyyy-MM-dd')}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.changed_at), 'HH:mm:ss')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.ip_address || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(log)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('auditLog.detailButton')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {logs.length > 50 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t('auditLog.moreLogsCount', { count: logs.length - 50 })}
            </p>
            <Button variant="outline" className="mt-2">
              {t('auditLog.loadMore')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
