import { useTranslation } from 'react-i18next';
import { MailOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { NotificationBulkActionsProps } from './types';

export const NotificationBulkActions = ({
  selectedCount,
  onMarkSelectedAsRead,
  onDeleteSelected,
}: NotificationBulkActionsProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {t('notificationPage.selectedCount', { count: selectedCount })}
          </span>
          <Button size="sm" variant="outline" onClick={onMarkSelectedAsRead}>
            <MailOpen className="h-4 w-4 mr-1" />
            {t('notificationPage.markRead')}
          </Button>
          <Button size="sm" variant="outline" onClick={onDeleteSelected}>
            <Trash2 className="h-4 w-4 mr-1" />
            {t('common.delete')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
