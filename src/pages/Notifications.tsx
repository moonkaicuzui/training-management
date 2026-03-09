import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Bell,
  BellRing,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  Settings,
  Mail,
  MailOpen,
  Trash2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import type { Notification, NotificationType, NotificationPriority } from '@/types/notification';
import * as api from '@/services/api';

// 알림 타입 아이콘
const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'TRAINING_REMINDER':
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'EXPIRY_WARNING':
      return <Clock className="h-5 w-5 text-orange-500" />;
    case 'RETRAINING_REQUIRED':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'SESSION_CANCELLED':
      return <XCircle className="h-5 w-5 text-gray-500" />;
    case 'RESULT_AVAILABLE':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'CERTIFICATE_READY':
      return <Award className="h-5 w-5 text-purple-500" />;
    case 'SYSTEM':
      return <Bell className="h-5 w-5 text-gray-600" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

// 우선순위 배지
const PriorityBadge = ({ priority }: { priority: NotificationPriority }) => {
  const { t } = useTranslation();
  const config: Record<NotificationPriority, { label: string; variant: 'default' | 'secondary' | 'warning' | 'destructive' }> = {
    LOW: { label: t('notificationPage.priorityLow'), variant: 'secondary' },
    MEDIUM: { label: t('notificationPage.priorityMedium'), variant: 'default' },
    HIGH: { label: t('notificationPage.priorityHigh'), variant: 'warning' },
    URGENT: { label: t('notificationPage.priorityUrgent'), variant: 'destructive' },
  };
  const { label, variant } = config[priority];
  return <Badge variant={variant}>{label}</Badge>;
};

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

  // 알림 설정
  const [settings, setSettings] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    trainingReminder: true,
    expiryWarning: true,
    retrainingRequired: true,
    reminderDays: [7, 3, 1],
  });

  // Firebase에서 데이터 로드
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

  // 알림 설정 로드
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

  // 필터링된 알림
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

  // 통계
  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    urgent: notifications.filter(n => n.priority === 'URGENT' && !n.is_read).length,
    today: notifications.filter(n =>
      format(new Date(n.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    ).length,
  }), [notifications]);

  // 읽음 처리
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n =>
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch {
      // 실패 시 다시 로드
      loadData();
    }
  };

  // 전체 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead('current-user');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      loadData();
    }
  };

  // 선택 항목 읽음 처리
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

  // 삭제
  const handleDelete = async (notificationId: string) => {
    try {
      await api.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
    } catch {
      loadData();
    }
  };

  // 선택 항목 삭제
  const handleDeleteSelected = async () => {
    try {
      await api.batchDeleteNotifications(Array.from(selectedNotifications));
      setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.notification_id)));
      setSelectedNotifications(new Set());
    } catch {
      loadData();
    }
  };

  // 전체 선택
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.notification_id)));
    } else {
      setSelectedNotifications(new Set());
    }
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
            {t('common.retry', '재시도')}
          </Button>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{t('notificationPage.totalNotifications')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Mail className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unread}</p>
                <p className="text-xs text-muted-foreground">{t('notificationPage.unread')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <BellRing className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.urgent}</p>
                <p className="text-xs text-muted-foreground">{t('notificationPage.urgent')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-xs text-muted-foreground">{t('notificationPage.todayNotifications')}</p>
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
                placeholder={t('notificationPage.searchPlaceholder')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t('notificationPage.colType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('notificationPage.allTypes')}</SelectItem>
                <SelectItem value="TRAINING_REMINDER">{t('notificationPage.typeSchedule')}</SelectItem>
                <SelectItem value="EXPIRY_WARNING">{t('notificationPage.typeExpiring')}</SelectItem>
                <SelectItem value="RETRAINING_REQUIRED">{t('notificationPage.typeRetraining')}</SelectItem>
                <SelectItem value="RESULT_AVAILABLE">{t('notificationPage.typeResult')}</SelectItem>
                <SelectItem value="CERTIFICATE_READY">{t('notificationPage.typeCertificate')}</SelectItem>
                <SelectItem value="SYSTEM">{t('notificationPage.typeSystem')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder={t('notificationPage.colPriority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('notificationPage.priorityAll')}</SelectItem>
                <SelectItem value="URGENT">{t('notificationPage.priorityUrgent')}</SelectItem>
                <SelectItem value="HIGH">{t('notificationPage.priorityHigh')}</SelectItem>
                <SelectItem value="MEDIUM">{t('notificationPage.priorityMedium')}</SelectItem>
                <SelectItem value="LOW">{t('notificationPage.priorityLow')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                checked={showUnreadOnly}
                onCheckedChange={setShowUnreadOnly}
              />
              <Label>{t('notificationPage.unreadOnly')}</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 일괄 작업 */}
      {selectedNotifications.size > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {t('notificationPage.selectedCount', { count: selectedNotifications.size })}
              </span>
              <Button size="sm" variant="outline" onClick={handleMarkSelectedAsRead}>
                <MailOpen className="h-4 w-4 mr-1" />
                {t('notificationPage.markRead')}
              </Button>
              <Button size="sm" variant="outline" onClick={handleDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-1" />
                {t('common.delete')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 알림 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('notificationPage.notificationList')}</CardTitle>
          <CardDescription>
            {t('notificationPage.totalCount', { count: filteredNotifications.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                    onCheckedChange={handleSelectAll}
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
              {filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {t('notificationPage.emptyState')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.slice(0, 20).map((notification) => (
                  <TableRow
                    key={notification.notification_id}
                    className={notification.is_read ? 'opacity-60' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedNotifications.has(notification.notification_id)}
                        onCheckedChange={(checked) => {
                          const next = new Set(selectedNotifications);
                          if (checked) {
                            next.add(notification.notification_id);
                          } else {
                            next.delete(notification.notification_id);
                          }
                          setSelectedNotifications(next);
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
                            onClick={() => handleMarkAsRead(notification.notification_id)}
                          >
                            <MailOpen className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(notification.notification_id)}
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

      {/* 알림 설정 다이얼로그 */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('notificationPage.settingsTitle')}</DialogTitle>
            <DialogDescription>
              {t('notificationPage.settingsDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="font-medium">{t('notificationPage.receiveMethod')}</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="email">{t('notificationPage.emailNotification')}</Label>
                <Switch
                  id="email"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(s => ({ ...s, emailNotifications: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="inapp">{t('notificationPage.inAppNotification')}</Label>
                <Switch
                  id="inapp"
                  checked={settings.inAppNotifications}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(s => ({ ...s, inAppNotifications: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">{t('notificationPage.notificationType')}</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="training">{t('notificationPage.scheduleNotification')}</Label>
                <Switch
                  id="training"
                  checked={settings.trainingReminder}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(s => ({ ...s, trainingReminder: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="expiry">{t('notificationPage.expiringNotification')}</Label>
                <Switch
                  id="expiry"
                  checked={settings.expiryWarning}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(s => ({ ...s, expiryWarning: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="retraining">{t('notificationPage.retrainingNotification')}</Label>
                <Switch
                  id="retraining"
                  checked={settings.retrainingRequired}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(s => ({ ...s, retrainingRequired: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">{t('notificationPage.reminderTiming')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('notificationPage.reminderTimingDesc')}
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 3, 7, 14, 30].map((days) => (
                  <Badge
                    key={days}
                    variant={settings.reminderDays.includes(days) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setSettings(s => ({
                        ...s,
                        reminderDays: s.reminderDays.includes(days)
                          ? s.reminderDays.filter(d => d !== days)
                          : [...s.reminderDays, days].sort((a, b) => b - a),
                      }));
                    }}
                  >
                    {t('notificationPage.daysBefore', { days })}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={async () => {
              try {
                await api.updateNotificationSettings('current-user', settings);
              } catch {
                // 설정 저장 실패 무시
              }
              setSettingsDialogOpen(false);
            }}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
