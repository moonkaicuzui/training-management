import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Settings, MailOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/types/notification';
import * as api from '@/services/api';
import {
  NotificationStatsCards,
  NotificationFilters,
  NotificationBulkActions,
  NotificationTable,
  NotificationSettingsDialog,
} from '@/components/notifications';
import type { NotificationSettings } from '@/components/notifications';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    inAppNotifications: true,
    trainingReminder: true,
    expiryWarning: true,
    retrainingRequired: true,
    reminderDays: [7, 3, 1],
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = await api.getNotificationSettings('current-user');
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch {
      // 설정 로드 실패 시 기본값 유지
    }
  }, []);

  useEffect(() => {
    Promise.all([loadData(), loadSettings()]).catch(() => {});
  }, [loadData, loadSettings]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || n.type === selectedType;
      const matchesPriority = selectedPriority === 'all' || n.priority === selectedPriority;
      const matchesUnread = !showUnreadOnly || !n.is_read;
      return matchesSearch && matchesType && matchesPriority && matchesUnread;
    });
  }, [notifications, searchQuery, selectedType, selectedPriority, showUnreadOnly]);

  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    urgent: notifications.filter(n => n.priority === 'URGENT' && !n.is_read).length,
    today: notifications.filter(n =>
      format(new Date(n.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    ).length,
  }), [notifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n =>
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch {
      loadData();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead('current-user');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      loadData();
    }
  };

  const handleMarkSelectedAsRead = async () => {
    try {
      const promises = Array.from(selectedNotifications).map(id =>
        api.markNotificationAsRead(id)
      );
      await Promise.all(promises);
      setNotifications(prev => prev.map(n =>
        selectedNotifications.has(n.notification_id) ? { ...n, is_read: true } : n
      ));
      setSelectedNotifications(new Set());
    } catch {
      loadData();
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await api.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
    } catch {
      loadData();
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await api.batchDeleteNotifications(Array.from(selectedNotifications));
      setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.notification_id)));
      setSelectedNotifications(new Set());
    } catch {
      loadData();
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.notification_id)));
    } else {
      setSelectedNotifications(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedNotifications);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedNotifications(next);
  };

  const handleSaveSettings = async () => {
    try {
      await api.updateNotificationSettings('current-user', settings);
    } catch {
      // 설정 저장 실패 무시
    }
    setSettingsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('notificationPage.title')}</h1>
          <p className="text-muted-foreground">{t('notificationPage.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            {t('notificationPage.settings')}
          </Button>
          <Button onClick={handleMarkAllAsRead} disabled={stats.unread === 0}>
            <MailOpen className="h-4 w-4 mr-2" />
            {t('notificationPage.markAllRead')}
          </Button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadData}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      <NotificationStatsCards stats={stats} />

      <NotificationFilters
        searchQuery={searchQuery}
        selectedType={selectedType}
        selectedPriority={selectedPriority}
        showUnreadOnly={showUnreadOnly}
        onSearchChange={setSearchQuery}
        onTypeChange={setSelectedType}
        onPriorityChange={setSelectedPriority}
        onUnreadOnlyChange={setShowUnreadOnly}
      />

      {selectedNotifications.size > 0 && (
        <NotificationBulkActions
          selectedCount={selectedNotifications.size}
          onMarkSelectedAsRead={handleMarkSelectedAsRead}
          onDeleteSelected={handleDeleteSelected}
        />
      )}

      <NotificationTable
        notifications={filteredNotifications}
        selectedNotifications={selectedNotifications}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
      />

      <NotificationSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        settings={settings}
        onSettingsChange={setSettings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
