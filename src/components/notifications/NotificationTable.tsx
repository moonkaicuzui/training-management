import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Bell, MailOpen, Trash2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { NotificationIcon } from './NotificationIcon';
import { PriorityBadge } from './PriorityBadge';
import type { NotificationTableProps } from './types';

export const NotificationTable = ({
  notifications,
  selectedNotifications,
  onSelectAll,
  onSelectOne,
  onMarkAsRead,
  onDelete,
}: NotificationTableProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('notificationPage.notificationList')}</CardTitle>
        <CardDescription>
          {t('notificationPage.totalCount', { count: notifications.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedNotifications.size === notifications.length && notifications.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead>{t('notificationPage.colType')}</TableHead>
              <TableHead>{t('notificationPage.colTitle')}</TableHead>
              <TableHead>{t('notificationPage.colPriority')}</TableHead>
              <TableHead>{t('notificationPage.colDate')}</TableHead>
              <TableHead>{t('notificationPage.colStatus')}</TableHead>
              <TableHead className="text-right">{t('notificationPage.colActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {t('notificationPage.emptyState')}
                </TableCell>
              </TableRow>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <TableRow
                  key={notification.notification_id}
                  className={notification.is_read ? 'opacity-60' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedNotifications.has(notification.notification_id)}
                      onCheckedChange={(checked: boolean) => {
                        onSelectOne(notification.notification_id, checked);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <NotificationIcon type={notification.type} />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className={`font-medium ${!notification.is_read ? 'font-bold' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {notification.message}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={notification.priority} />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(notification.created_at), 'yyyy-MM-dd HH:mm')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {notification.is_read ? (
                      <Badge variant="secondary">{t('notificationPage.statusRead')}</Badge>
                    ) : (
                      <Badge variant="default">{t('notificationPage.statusNew')}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!notification.is_read && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onMarkAsRead(notification.notification_id)}
                        >
                          <MailOpen className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDelete(notification.notification_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
