import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import {
  History,
  Search,
  FileText,
  User,
  Calendar,
  Clock,
  Eye,
  Download,
  Edit,
  Trash2,
  Plus,
  RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { AuditLogEntry } from '@/types/auditLog';
import * as api from '@/services/api';

// 로그 상세 다이얼로그
function LogDetailDialog({
  open,
  onClose,
  log,
}: {
  open: boolean;
  onClose: () => void;
  log: AuditLogEntry | null;
}) {
  const { t } = useTranslation();
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('auditLog.detailTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('auditLog.logId')}: {log.log_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 기본 정보 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('auditLog.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('auditLog.actionType')}</p>
                  <Badge variant={
                    log.action === 'CREATE' ? 'success' :
                    log.action === 'UPDATE' ? 'warning' :
                    log.action === 'DELETE' ? 'destructive' : 'secondary'
                  } className="mt-1">
                    {log.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('auditLog.entityType')}</p>
                  <p className="font-medium">{log.entity_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('auditLog.targetId')}</p>
                  <p className="font-mono">{log.entity_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('auditLog.operatorLabel')}</p>
                  <p className="font-medium">{log.changed_by}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('auditLog.operatedAt')}</p>
                  <p>{format(new Date(log.changed_at), 'yyyy-MM-dd HH:mm:ss')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('auditLog.ipAddress')}</p>
                  <p className="font-mono">{log.ip_address || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 변경 사유 */}
          {log.reason && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('auditLog.changeReason')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{log.reason}</p>
              </CardContent>
            </Card>
          )}

          {/* 변경 내역 */}
          {(log.before_data || log.after_data) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('auditLog.changeHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="after">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="before" disabled={!log.before_data}>
                      {t('auditLog.beforeChange')}
                    </TabsTrigger>
                    <TabsTrigger value="after" disabled={!log.after_data}>
                      {t('auditLog.afterChange')}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="before" className="mt-2">
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(log.before_data, null, 2)}
                    </pre>
                  </TabsContent>
                  <TabsContent value="after" className="mt-2">
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(log.after_data, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* 브라우저 정보 */}
          {log.user_agent && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('auditLog.clientInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground break-all">{log.user_agent}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AuditLogPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 필터링된 로그
  const filteredLogs = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const cutoffDate = subDays(new Date(), periodDays);

    return logs.filter((log) => {
      const matchesSearch =
        log.log_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.changed_by.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEntityType = selectedEntityType === 'all' || log.entity_type === selectedEntityType;
      const matchesAction = selectedAction === 'all' || log.action === selectedAction;
      const matchesPeriod = new Date(log.changed_at) >= cutoffDate;

      return matchesSearch && matchesEntityType && matchesAction && matchesPeriod;
    });
  }, [logs, searchQuery, selectedEntityType, selectedAction, selectedPeriod]);

  // 통계
  const stats = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const cutoffDate = subDays(new Date(), periodDays);
    const periodLogs = logs.filter(log => new Date(log.changed_at) >= cutoffDate);

    return {
      total: periodLogs.length,
      creates: periodLogs.filter(l => l.action === 'CREATE').length,
      updates: periodLogs.filter(l => l.action === 'UPDATE').length,
      deletes: periodLogs.filter(l => l.action === 'DELETE').length,
      uniqueUsers: new Set(periodLogs.map(l => l.changed_by)).size,
    };
  }, [logs, selectedPeriod]);

  const handleViewDetail = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const getActionIcon = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'CREATE':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'VIEW':
        return <Eye className="h-4 w-4 text-gray-500" />;
      case 'EXPORT':
        return <Download className="h-4 w-4 text-purple-500" />;
      default:
        return <RefreshCcw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadge = (action: AuditLogEntry['action']) => {
    const variants: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'default'> = {
      CREATE: 'success',
      UPDATE: 'warning',
      DELETE: 'destructive',
      VIEW: 'secondary',
      EXPORT: 'default',
      LOGIN: 'default',
      LOGOUT: 'secondary',
    };
    return variants[action] || 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('auditLog.title')}</h1>
          <p className="text-muted-foreground">{t('auditLog.description')}</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('auditLog.exportLogs')}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadData}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <History className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{t('auditLog.totalActivities')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.creates}</p>
                <p className="text-xs text-muted-foreground">{t('auditLog.created')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Edit className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.updates}</p>
                <p className="text-xs text-muted-foreground">{t('auditLog.updated')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.deletes}</p>
                <p className="text-xs text-muted-foreground">{t('auditLog.deleted')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                <p className="text-xs text-muted-foreground">{t('auditLog.activeUsers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('auditLog.searchPlaceholder')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t('auditLog.entityType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('auditLog.allEntityTypes')}</SelectItem>
                <SelectItem value="PROGRAM">{t('auditLog.entityProgram')}</SelectItem>
                <SelectItem value="RESULT">{t('auditLog.entityResult')}</SelectItem>
                <SelectItem value="SESSION">{t('auditLog.entitySession')}</SelectItem>
                <SelectItem value="EMPLOYEE">{t('auditLog.entityEmployee')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t('auditLog.actionType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('auditLog.allActions')}</SelectItem>
                <SelectItem value="CREATE">{t('auditLog.actionCreate')}</SelectItem>
                <SelectItem value="UPDATE">{t('auditLog.actionUpdate')}</SelectItem>
                <SelectItem value="DELETE">{t('auditLog.actionDelete')}</SelectItem>
                <SelectItem value="VIEW">{t('auditLog.actionRead')}</SelectItem>
                <SelectItem value="EXPORT">{t('auditLog.actionExport')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t('auditLog.dateTime')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('auditLog.last1Day')}</SelectItem>
                <SelectItem value="7">{t('auditLog.last7Days')}</SelectItem>
                <SelectItem value="30">{t('auditLog.last30Days')}</SelectItem>
                <SelectItem value="90">{t('auditLog.last90Days')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 로그 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('auditLog.title')}</CardTitle>
          <CardDescription>
            {t('auditLog.filteredCount', { count: filteredLogs.length })}
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
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {t('auditLog.emptyState')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.slice(0, 50).map((log) => (
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
                        onClick={() => handleViewDetail(log)}
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

          {filteredLogs.length > 50 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auditLog.moreLogsCount', { count: filteredLogs.length - 50 })}
              </p>
              <Button variant="outline" className="mt-2">
                {t('auditLog.loadMore')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 로그 상세 다이얼로그 */}
      <LogDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        log={selectedLog}
      />
    </div>
  );
}
