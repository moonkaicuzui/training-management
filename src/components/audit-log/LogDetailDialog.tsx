import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import type { LogDetailDialogProps } from './types';

export function LogDetailDialog({ open, onClose, log }: LogDetailDialogProps) {
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
