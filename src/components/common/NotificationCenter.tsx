import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useShallow } from 'zustand/react/shallow';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';

function NotificationItem({
  notification,
  onSelect,
}: {
  notification: Notification;
  onSelect: (n: Notification) => void;
}) {
  return (
    <button
      className={`w-full text-left p-3 border-b hover:bg-accent transition-colors ${
        !notification.read ? 'bg-accent/30' : ''
      }`}
      onClick={() => onSelect(notification)}
    >
      <div className="flex items-start gap-2">
        {!notification.read && (
          <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{notification.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </button>
  );
}

export function NotificationCenter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore(useShallow((state) => ({ notifications: state.notifications, markAsRead: state.markAsRead, markAllAsRead: state.markAllAsRead, unreadCount: state.unreadCount })));
  const [open, setOpen] = useState(false);
  const count = unreadCount();

  const unreadNotifications = notifications.filter((n) => !n.read);

  const handleSelect = (notification: Notification) => {
    markAsRead(notification.id);
    setOpen(false);
    navigate(notification.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t('header.notifications')}>
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">{t('notifications.title')}</h4>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full rounded-none border-b h-9">
            <TabsTrigger value="all" className="flex-1 text-xs">
              {t('notifications.all')}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 text-xs">
              {t('notifications.unread')}
              {count > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {count}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="m-0">
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Check className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('notifications.empty')}
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} onSelect={handleSelect} />
                ))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="m-0">
            <ScrollArea className="h-[300px]">
              {unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Check className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('notifications.noUnread')}
                  </p>
                </div>
              ) : (
                unreadNotifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} onSelect={handleSelect} />
                ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
          >
            {t('notifications.viewAll')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
