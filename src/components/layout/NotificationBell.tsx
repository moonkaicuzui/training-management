/**
 * 프로젝트 알림 벨 컴포넌트
 *
 * 헤더에 배치되어 읽지 않은 알림 수 표시 + 클릭 시 알림 목록 팝오버
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectStore } from '@/stores/projectStore';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useUIStore } from '@/stores/uiStore';

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const language = useUIStore((s) => s.language);
  const {
    notifications,
    unreadNotificationCount,
    subscribeNotificationsRealtime,
    markNotificationRead,
    markAllNotificationsRead,
  } = useProjectStore();

  useEffect(() => {
    subscribeNotificationsRealtime();
  }, [subscribeNotificationsRealtime]);

  const handleNotificationClick = (notification: (typeof notifications)[0]) => {
    if (!notification.isRead) {
      markNotificationRead(notification.id);
    }
    // 과제가 있으면 과제 페이지로 이동
    if (notification.taskId) {
      navigate('/projects/tasks');
    }
  };

  const formatTime = (date: Date | { toDate?: () => Date } | undefined) => {
    if (!date) return '';
    const d = date instanceof Date ? date : (date as { toDate: () => Date }).toDate?.() || new Date(date as unknown as string);
    try {
      return formatDistanceToNow(d, {
        addSuffix: true,
        locale: language === 'ko' ? ko : undefined,
      });
    } catch {
      return '';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t('projects.notifications.title')}>
          <Bell className="h-5 w-5" />
          {unreadNotificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] flex items-center justify-center"
            >
              {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">{t('projects.notifications.title')}</h4>
          {unreadNotificationCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markAllNotificationsRead()}
            >
              <Check className="h-3 w-3" />
              {t('projects.notifications.markAllRead')}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {t('projects.notifications.noNotifications')}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                    !notification.isRead ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                    <div className={`flex-1 min-w-0 ${notification.isRead ? 'ml-4' : ''}`}>
                      <p className="text-sm line-clamp-2">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
